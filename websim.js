// websim.js - Placeholder for the websim environment library
// In a real websim environment, this file would be provided.
// For local development, you might mock its functions.

class WebsimSocket {
    constructor() {
        this.collections = {};
        this.subscriptions = {};
        this.presenceData = { users: [], me: { username: `User_${Math.random().toString(36).substring(7)}`, id: 'local-user-id' } };
        this.presenceSubs = [];
        this.mockLatency = 50; // ms
        this.mockDb = {}; // In-memory storage for local dev
        console.log(`[Websim Mock] User: ${this.presenceData.me.username}`);

        // Generate some mock presence data
        setInterval(() => {
            if (Math.random() > 0.8 && this.presenceData.users.length < 5) {
                const newUser = { username: `Bot_${Math.random().toString(36).substring(7)}`, id: `bot-${Date.now()}` };
                this.presenceData.users.push(newUser);
                this._notifyPresenceSubscribers();
            } else if (Math.random() > 0.9 && this.presenceData.users.length > 0) {
                this.presenceData.users.pop();
                 this._notifyPresenceSubscribers();
            }
        }, 3000);
    }

    collection(type) {
        if (!this.collections[type]) {
            this.collections[type] = new CollectionHandler(type, this);
        }
        return this.collections[type];
    }

     // --- Presence ---
     getPresence() {
        return this.presenceData;
     }

     subscribePresence(callback) {
         if (typeof callback !== 'function') return () => {};
         this.presenceSubs.push(callback);
         // Immediate notification with current state
         try {
             callback(this.presenceData);
         } catch (e) { console.error("Error in presence subscriber callback:", e); }

         const unsubscribe = () => {
             this.presenceSubs = this.presenceSubs.filter(sub => sub !== callback);
         };
         return unsubscribe;
     }

    _notifyPresenceSubscribers() {
        // Deep copy to prevent mutation issues
        const dataCopy = JSON.parse(JSON.stringify(this.presenceData));
        this.presenceSubs.forEach(sub => {
             try {
                 sub(dataCopy);
             } catch (e) { console.error("Error in presence subscriber callback:", e); }
         });
     }

    // --- Mock DB Operations ---
    _notifySubscribers(type) {
        if (this.subscriptions[type]) {
            const collectionHandler = this.collection(type); // Get handler to apply filters
            this.subscriptions[type].forEach(sub => {
                // Apply the filter associated with the subscription
                const filteredList = collectionHandler.getList(sub.filter);
                try {
                    sub.callback(filteredList);
                } catch (e) { console.error(`Error in ${type} subscriber callback:`, e); }
            });
        }
    }

     _getCollectionData(type) {
        return this.mockDb[type] || [];
    }

     _setCollectionData(type, data) {
        this.mockDb[type] = data;
        this._notifySubscribers(type);
    }

    // --- Mock LLM ---
    async _mockLlmCall(messages) {
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500)); // Simulate network latency + processing
        const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
        const lastSystemMessage = messages.find(m => m.role === 'system');
        let responseContent = "Okay, I understand.";

         if (lastSystemMessage?.content?.includes("debate")) {
             responseContent = `Considering the topic and my persona (${lastSystemMessage?.content?.match(/persona is: "([^"]+)"/)?.[1] || 'unknown'}), I will argue that ${lastUserMessage?.content ? `your point about "${lastUserMessage.content.substring(0, 30)}..." is interesting, but...` : 'my stance is correct because...'}. Furthermore, let me add that *emphasis* and \`code\` might be useful here. \n\n1. Point one\n2. Point two`;
         } else if (lastUserMessage) {
             responseContent = `Okay, responding to "${lastUserMessage.content.substring(0, 50)}".`;
         }

        return {
            role: 'assistant', // Standard role for LLM responses
            content: responseContent
        };
    }

    chat = {
        completions: {
            create: async ({ messages, json }) => {
                 console.log("[Websim Mock] LLM Request:", messages);
                 const result = await this._mockLlmCall(messages);
                  console.log("[Websim Mock] LLM Response:", result);
                  if (json) {
                      // Attempt to format as JSON if requested, basic mock
                      try {
                          // This is a very naive mock JSON response based on typical requests
                           if (messages[0]?.content?.includes("{ concept: string; emoji: string; }")) {
                               result.content = JSON.stringify({ concept: "Mocked Concept", emoji: "💡" });
                           } else if (messages[0]?.content?.includes("{ isPhotograph: boolean; isAnimal: boolean; isInNature: boolean; }")) {
                               result.content = JSON.stringify({ isPhotograph: true, isAnimal: Math.random() > 0.5, isInNature: Math.random() > 0.3 });
                           } else {
                              result.content = JSON.stringify({ mocked: true, response: result.content });
                           }
                      } catch (e) {
                          console.error("Failed to mock JSON response", e);
                           result.content = JSON.stringify({ error: "failed to generate mock JSON" });
                      }
                  }
                 return Promise.resolve(result);
            }
        }
    }

     // --- Mock Image Gen ---
     imageGen = async ({ prompt, aspect_ratio, width, height, seed }) => {
        console.log("[Websim Mock] Image Gen Request:", { prompt, aspect_ratio, width, height, seed });
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000)); // Simulate image generation time
        const mockUrl = `https://via.placeholder.com/${width || (aspect_ratio === '16:9' ? 640 : 512)}x${height || (aspect_ratio === '16:9' ? 360 : 512)}/CCCCCC/888888?text=${encodeURIComponent(prompt.substring(0,30))}${seed ? '+seed'+seed : ''}`;
         console.log("[Websim Mock] Image Gen Response:", mockUrl);
        return Promise.resolve({ url: mockUrl });
     }


     // --- Mock Upload ---
     upload = async (file) => {
        console.log("[Websim Mock] Upload Request:", file.name, file.type, file.size);
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300)); // Simulate upload time
         const mockUrl = `https://mockstorage.websim.ai/uploads/${Date.now()}-${file.name}`;
          console.log("[Websim Mock] Upload Response:", mockUrl);
         return Promise.resolve(mockUrl);
     }

      // --- Mock User Info ---
      async getCreatedBy() {
           // Simulate fetching creator info
           await new Promise(resolve => setTimeout(resolve, 50));
           return Promise.resolve({ username: "CreatorNick", id: "creator-id-123" });
       }
}

class CollectionHandler {
    constructor(type, socket) {
        this.type = type;
        this.socket = socket;
        this.currentFilter = null; // Store the current filter for this handler instance
        // Pre-bind methods to maintain 'this' context
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
        this.getList = this.getList.bind(this);
        this.filter = this.filter.bind(this);
        this.subscribe = this.subscribe.bind(this);
    }

    async create(data) {
        await new Promise(resolve => setTimeout(resolve, this.socket.mockLatency));
        const collection = this.socket._getCollectionData(this.type);
        const newRecord = {
            ...data,
            id: `${this.type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            username: this.socket.presenceData.me.username,
            created_at: new Date().toISOString(),
            type: this.type,
        };
        collection.push(newRecord);
        this.socket._setCollectionData(this.type, collection);
        console.log(`[Websim Mock DB] Created ${this.type}:`, newRecord);
        return { ...newRecord }; // Return a copy
    }

    async update(id, data) {
        await new Promise(resolve => setTimeout(resolve, this.socket.mockLatency));
        let collection = this.socket._getCollectionData(this.type);
        let updated = false;
        collection = collection.map(record => {
            // Only allow updating own records in mock
            if (record.id === id && record.username === this.socket.presenceData.me.username) {
                updated = true;
                console.log(`[Websim Mock DB] Updated ${this.type} (${id}):`, data);
                return { ...record, ...data };
            }
            return record;
        });
         if (updated) {
            this.socket._setCollectionData(this.type, collection);
            return true;
         } else {
             console.warn(`[Websim Mock DB] Update failed for ${this.type} (${id}): Record not found or permission denied.`);
             return false; // Indicate failure
         }
    }

    async delete(id) {
        await new Promise(resolve => setTimeout(resolve, this.socket.mockLatency));
        let collection = this.socket._getCollectionData(this.type);
        const initialLength = collection.length;
        collection = collection.filter(record => {
             // Only allow deleting own records in mock
            if (record.id === id && record.username === this.socket.presenceData.me.username) {
                 console.log(`[Websim Mock DB] Deleted ${this.type} (${id})`);
                return false; // Filter out the record
            }
            return true;
        });
         if (collection.length < initialLength) {
             this.socket._setCollectionData(this.type, collection);
             return true;
         } else {
              console.warn(`[Websim Mock DB] Delete failed for ${this.type} (${id}): Record not found or permission denied.`);
             return false; // Indicate failure (not found or permission denied)
         }
    }

    getList(filter = this.currentFilter) {
         // Always return a new array copy sorted newest first
        const collection = [...this.socket._getCollectionData(this.type)];
        collection.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Newest first

        if (!filter) {
            // console.log(`[Websim Mock DB] GetList ${this.type} (unfiltered):`, collection);
            return collection;
        }

        const filteredList = collection.filter(record => {
            return Object.keys(filter).every(key => {
                return record[key] === filter[key];
            });
        });
        // console.log(`[Websim Mock DB] GetList ${this.type} (filtered by ${JSON.stringify(filter)}):`, filteredList);
        return filteredList;
    }

    filter(filterObj) {
        // Return a *new* handler instance with the filter applied
        // This is crucial for useSyncExternalStore to detect changes
        const newHandler = new CollectionHandler(this.type, this.socket);
        newHandler.currentFilter = filterObj ? { ...filterObj } : null; // Store a copy of the filter
        console.log(`[Websim Mock DB] Creating filtered handler for ${this.type} with filter:`, newHandler.currentFilter);
        return newHandler;
    }


    subscribe(callback) {
        if (typeof callback !== 'function') return () => {};

        if (!this.socket.subscriptions[this.type]) {
            this.socket.subscriptions[this.type] = [];
        }

        const subscriptionRecord = { callback, filter: this.currentFilter ? { ...this.currentFilter } : null };
         console.log(`[Websim Mock DB] Subscribing to ${this.type} with filter:`, subscriptionRecord.filter);
        this.socket.subscriptions[this.type].push(subscriptionRecord);

        // Immediate callback with current filtered data
        try {
            callback(this.getList());
        } catch (e) { console.error(`Error in initial ${this.type} subscriber callback:`, e); }


        const unsubscribe = () => {
             console.log(`[Websim Mock DB] Unsubscribing from ${this.type} with filter:`, subscriptionRecord.filter);
            if (this.socket.subscriptions[this.type]) {
                this.socket.subscriptions[this.type] = this.socket.subscriptions[this.type].filter(sub => sub !== subscriptionRecord);
                if (this.socket.subscriptions[this.type].length === 0) {
                    delete this.socket.subscriptions[this.type];
                }
            }
        };
        return unsubscribe;
    }
}


// Expose the mock socket globally for the app
window.websim = new WebsimSocket();
window.WebsimSocket = WebsimSocket; // Make class available if needed elsewhere

console.log("[Websim Mock] Initialized");
`````` index.html
<!DOCTYPE html>
<html>
<head>
    <title>AI Debate Club</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.development.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>
    {/* Add Luxon for date formatting */}
    <script src="https://cdn.jsdelivr.net/npm/luxon@3.4.4/build/global/luxon.min.js"></script>
    {/* Add react-markdown for rendering AI responses */}
    <script src="https://cdn.jsdelivr.net/npm/react-markdown@8/react-markdown.min.js"></script>
    {/* Websim environment script */}
    <script src="/websim.js"></script>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="root"></div>
    {/* Reference the JSX app file */}
    <script type="text/babel" src="app.jsx"></script>
</body>
</html>

// websim.js - Mock environment for local development
// Provides implementations for WebsimSocket, LLM, ImageGen, Upload based on documentation

class WebsimSocket {
    constructor(config = {}) {
        this.presenceData = {
            me: { id: `user_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`, username: config.username || `User_${Math.random().toString(16).substring(2, 8)}` },
            users: [] // Other users in the room
        };
        this.presenceInterval = null;
        this.presenceSubs = new Set();
        this.collections = {}; // Holds CollectionHandler instances
        this.mockDb = {}; // { collectionType: [record1, record2] }
        this.subscriptions = {}; // { collectionType: Set( { callback, filter } ) }
        this.mockLatency = config.latency ?? 150; // ms
        this.logEnabled = config.logging ?? true;

        if (this.logEnabled) console.log(`[Websim Mock] Initialized for user: ${this.presenceData.me.username}`);
        this._startPresenceSimulation();
    }

    _log(message, ...args) {
        if (this.logEnabled) {
            console.log(`[Websim Mock] ${message}`, ...args);
        }
    }

    // --- Collections ---
    collection(type) {
        if (!this.collections[type]) {
            this.collections[type] = new CollectionHandler(type, this);
        }
        return this.collections[type];
    }

    _notifySubscribers(type) {
        if (!this.subscriptions[type]) return;

        // Create snapshots for each filter variation to avoid re-filtering per subscriber
        const snapshots = {};
        const getSnapshot = (filter) => {
            const filterKey = filter ? JSON.stringify(filter) : 'null';
            if (!snapshots[filterKey]) {
                 snapshots[filterKey] = this.collection(type).getList(filter);
                 // this._log(`Created snapshot for ${type} filter ${filterKey}`, snapshots[filterKey].length);
            }
            return snapshots[filterKey];
        }

        // Use setTimeout to avoid potential infinite loops if a subscriber triggers another db op immediately
        setTimeout(() => {
             if (!this.subscriptions[type]) return; // Check again in case unsubscribed during timeout
             this.subscriptions[type].forEach(sub => {
                try {
                    const data = getSnapshot(sub.filter);
                    // this._log(`Notifying subscriber for ${type} with filter ${JSON.stringify(sub.filter)}`, data.length);
                    sub.callback(data);
                } catch (e) {
                    console.error(`[Websim Mock] Error in ${type} subscriber callback:`, e);
                }
            });
        }, 0);
    }

    _getCollectionData(type) {
        return this.mockDb[type] || [];
    }

    _setCollectionData(type, data) {
        this.mockDb[type] = data;
        this._notifySubscribers(type);
    }


    // --- Presence ---
     getPresence() {
        return JSON.parse(JSON.stringify(this.presenceData)); // Return deep copy
     }

     subscribePresence(callback) {
         if (typeof callback !== 'function') return () => {};
         this.presenceSubs.add(callback);
         this._log('Presence subscribed, total:', this.presenceSubs.size);
         // Immediate notification with current state
         try {
             callback(this.getPresence());
         } catch (e) { console.error("[Websim Mock] Error in initial presence subscriber callback:", e); }

         const unsubscribe = () => {
             this.presenceSubs.delete(callback);
             this._log('Presence unsubscribed, remaining:', this.presenceSubs.size);
         };
         return unsubscribe;
     }

    _notifyPresenceSubscribers() {
        const currentPresence = this.getPresence();
        this.presenceSubs.forEach(sub => {
             try {
                 sub(currentPresence);
             } catch (e) { console.error("[Websim Mock] Error in presence subscriber callback:", e); }
         });
     }

      _startPresenceSimulation() {
        if (this.presenceInterval) clearInterval(this.presenceInterval);

        // Add initial bots
        for(let i = 0; i < 2; i++) {
             const bot = { id: `bot_${Date.now()}_${i}`, username: `Bot_${i+1}` };
             this.presenceData.users.push(bot);
        }
        this._notifyPresenceSubscribers();


        this.presenceInterval = setInterval(() => {
            const action = Math.random();
            let changed = false;
            if (action < 0.1 && this.presenceData.users.length < 5) { // Add user
                const newUser = { id: `bot_${Date.now()}_${this.presenceData.users.length}`, username: `Bot_${this.presenceData.users.length + 1}` };
                this.presenceData.users.push(newUser);
                 this._log('Presence: User joined', newUser.username, this.presenceData.users.map(u=>u.username));
                changed = true;
            } else if (action > 0.9 && this.presenceData.users.length > 1) { // Remove user
                const removedUser = this.presenceData.users.pop();
                 this._log('Presence: User left', removedUser.username, this.presenceData.users.map(u=>u.username));
                changed = true;
            }

            if (changed) {
                this._notifyPresenceSubscribers();
            }
        }, 5000); // Simulate changes every 5 seconds
    }

    // --- LLM Chat ---
    chat = {
        completions: {
            create: async ({ messages, json }) => {
                this._log("LLM Request:", { messages: messages.map(m => ({role: m.role, content: m.content?.substring(0,100) + (m.content?.length > 100 ? '...' : '')})), json }); // Log truncated content
                await new Promise(resolve => setTimeout(resolve, this.mockLatency + 300 + Math.random() * 500)); // Simulate network latency + processing

                const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
                const systemPrompt = messages.find(m => m.role === 'system')?.content || "";
                let responseContent = "Okay, I will respond to that.";

                // Simple persona-based response for debate
                if (systemPrompt.includes("debate on")) {
                    const personaMatch = systemPrompt.match(/Your persona: "([^"]+)"/);
                    const persona = personaMatch ? personaMatch[1] : "a debater";
                    const topicMatch = systemPrompt.match(/debate on "([^"]+)"/);
                    const topic = topicMatch ? topicMatch[1] : "the topic";
                     responseContent = `Okay, as ${persona}, considering the topic "${topic}", I think... \n\nMy main points are:\n*   Point one about \`${lastUserMessage?.content?.split(' ')[0] || 'the start'}\`.\n*   **Another** important consideration.\n\nWhat are your thoughts?`;
                } else if (lastUserMessage) {
                     responseContent = `Got it. You mentioned "${lastUserMessage.content.substring(0, 50)}". My thoughts on this are...`;
                }

                let result;
                if (json) {
                     this._log("LLM Mock: Generating JSON response");
                     let jsonObj = { mocked: true, received: lastUserMessage?.content?.substring(0, 50) || 'no user message' };
                    // Try to parse schema from system prompt (very basic)
                    try {
                       const schemaMatch = systemPrompt.match(/(\{[\s\S]*\})/);
                       if (schemaMatch) {
                            const schema = JSON.parse(schemaMatch[1].replace(/;\s*\}/g, '}').replace(/string;/g, '"string"').replace(/boolean;/g, 'true').replace(/number;/g, '123')); // Very crude schema parser
                            if (schema.concept) jsonObj = { concept: "Mocked Concept", emoji: "💡" };
                            if (schema.isPhotograph !== undefined) jsonObj = { isPhotograph: Math.random() > 0.2, isAnimal: Math.random() > 0.5, isInNature: Math.random() > 0.3 };
                       }
                    } catch(e) { this._log("LLM Mock: Couldn't parse JSON schema hint", e)}
                    result = { content: JSON.stringify(jsonObj, null, 2) };
                } else {
                     result = { content: responseContent };
                }

                // Add standard LLM response structure (role might vary in real API)
                 const response = {
                     role: 'assistant', // Standard OpenAI role for response
                     ...result
                 };

                this._log("LLM Response:", response);
                return Promise.resolve(response);
            }
        }
    }

     // --- Mock Image Gen ---
     imageGen = async ({ prompt, aspect_ratio = "1:1", width, height, seed }) => {
        this._log("Image Gen Request:", { prompt, aspect_ratio, width, height, seed });
        await new Promise(resolve => setTimeout(resolve, this.mockLatency + 500 + Math.random() * 1000)); // Simulate image generation time

         if (!width || !height) {
             const [arW, arH] = aspect_ratio.split(':').map(Number);
             width = 512 * (arW / arH);
             height = 512;
             // Normalize common sizes somewhat
             if (aspect_ratio === "16:9") { width = 1024; height = 576; }
             else if (aspect_ratio === "1:1") { width = 512; height = 512; }
             else { width = Math.round(width); height = Math.round(height); }
         }

        const mockUrl = `https://via.placeholder.com/${width}x${height}/D1D5DB/4B5563?text=${encodeURIComponent(prompt.substring(0,30))}${seed ? '+s'+seed : ''}`;
        this._log("Image Gen Response:", mockUrl);
        return Promise.resolve({ url: mockUrl });
     }

     // --- Mock Upload ---
     upload = async (file) => {
        this._log("Upload Request:", file.name, file.type, file.size);
        if (!file || !file.name || !file.type || !file.size) {
             throw new Error("Invalid file object provided to upload.");
        }
        await new Promise(resolve => setTimeout(resolve, this.mockLatency + 200 + Math.random() * file.size / 10000)); // Simulate upload time based on size
        // Simple mock URL, doesn't actually store anything
        const mockUrl = `https://mockstorage.websim.ai/uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
        this._log("Upload Response:", mockUrl);
        return Promise.resolve(mockUrl);
     }

      // --- Mock User Info ---
      async getCreatedBy() {
           // Simulate fetching creator info
           await new Promise(resolve => setTimeout(resolve, this.mockLatency / 2));
           // In a real scenario, this would be the actual project creator
           const creator = { username: "Creator", id: "creator-id-static" };
            this._log("getCreatedBy Response:", creator);
           return Promise.resolve(creator);
       }

        // Clean up interval on script removal/reload (useful in some dev envs)
        disconnect() {
           if (this.presenceInterval) clearInterval(this.presenceInterval);
            this._log("Mock WebSocket disconnected, presence simulation stopped.");
        }
}

class CollectionHandler {
    constructor(type, socket) {
        this.type = type;
        this.socket = socket;
        this.currentFilter = null; // Filter specific to this handler instance if created via .filter()
         // Bind methods to ensure 'this' context is correct, especially when passed as callbacks
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
        this.getList = this.getList.bind(this);
        this.filter = this.filter.bind(this);
        this.subscribe = this.subscribe.bind(this);
    }

    async create(data) {
        await new Promise(resolve => setTimeout(resolve, this.socket.mockLatency));
        const collection = this.socket._getCollectionData(this.type);
        const newRecord = {
            // User data first
            ...data,
             // Automatically handled fields last (overwrites if user tried to set them)
            id: `${this.type}_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`,
            username: this.socket.presenceData.me.username,
            created_at: new Date().toISOString(),
            type: this.type, // Ensure type field is present
        };
        const newCollection = [...collection, newRecord];
        this.socket._setCollectionData(this.type, newCollection);
        this.socket._log(`Created ${this.type}:`, {id: newRecord.id, user: newRecord.username, data: data});
        return { ...newRecord }; // Return a copy
    }

    async update(id, data) {
        await new Promise(resolve => setTimeout(resolve, this.socket.mockLatency));
        let collection = this.socket._getCollectionData(this.type);
        let updated = false;
        const currentUser = this.socket.presenceData.me.username;
        const newCollection = collection.map(record => {
            if (record.id === id) {
                 if (record.username === currentUser) {
                    updated = true;
                    this.socket._log(`Updated ${this.type} (${id}) by ${currentUser}:`, data);
                    // Merge data, ensuring automatic fields aren't user-updatable
                    const { id: _, username: __, created_at: ___, type: ____, ...updateData } = data;
                    return { ...record, ...updateData };
                 } else {
                      this.socket._log(`Update failed for ${this.type} (${id}): Permission denied (owner: ${record.username}, current: ${currentUser}).`);
                      return record; // Permission denied
                 }
            }
            return record;
        });

         if (updated) {
            this.socket._setCollectionData(this.type, newCollection);
            return true; // Indicate success
         } else {
             // Check if record existed at all
             if (!collection.find(r => r.id === id)) {
                 this.socket._log(`Update failed for ${this.type} (${id}): Record not found.`);
             }
             return false; // Indicate failure (not found or permission denied)
         }
    }

    async delete(id) {
        await new Promise(resolve => setTimeout(resolve, this.socket.mockLatency));
        let collection = this.socket._getCollectionData(this.type);
        const initialLength = collection.length;
        const currentUser = this.socket.presenceData.me.username;
        let deleted = false;

        const newCollection = collection.filter(record => {
            if (record.id === id) {
                 if (record.username === currentUser) {
                    this.socket._log(`Deleted ${this.type} (${id}) by ${currentUser}`);
                    deleted = true;
                    return false; // Filter out (delete) the record
                 } else {
                     this.socket._log(`Delete failed for ${this.type} (${id}): Permission denied (owner: ${record.username}, current: ${currentUser}).`);
                     return true; // Keep record, permission denied
                 }
            }
            return true; // Keep other records
        });

         if (deleted) {
             this.socket._setCollectionData(this.type, newCollection);
             return true; // Indicate success
         } else {
              // Check if record existed at all
             if (!collection.find(r => r.id === id)) {
                 this.socket._log(`Delete failed for ${this.type} (${id}): Record not found.`);
             }
             return false; // Indicate failure (not found or permission denied)
         }
    }

     // Internal helper for filtering, used by getList and subscribe
     _applyFilter(records, filter) {
        if (!filter) {
            return records;
        }
        return records.filter(record => {
            return Object.keys(filter).every(key => {
                 // Handle null specifically for parent_id checks etc.
                return record[key] === filter[key];
            });
        });
    }


    getList(filter = this.currentFilter) {
         // Always get fresh data from the socket's mock DB
        const allRecords = [...this.socket._getCollectionData(this.type)];
        // Apply the filter provided (or the handler's default filter)
        const filteredRecords = this._applyFilter(allRecords, filter);
         // Sort newest first *after* filtering
        filteredRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        // this.socket._log(`GetList ${this.type} (Filter: ${JSON.stringify(filter)}): Found ${filteredRecords.length} records`);
        return filteredRecords; // Return the filtered & sorted list
    }

     // --- Filter factory ---
     // Stores the filter config and returns *itself* for chaining subscribe/getList
     // This ensures useSyncExternalStore sees stable function references if the filter itself is stable
     filterCache = new Map();
     filter(filterObj) {
         const filterKey = JSON.stringify(filterObj);
         if (!this.filterCache.has(filterKey)) {
            // Create a *new* handler instance conceptually, but reuse the class.
            // Assign the filter to the new instance's state.
            // In this mock, we can just return a handler-like object or modify state,
            // but let's stick to returning a new "conceptual" handler by cloning lightly.
             const newHandler = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
             newHandler.currentFilter = filterObj ? { ...filterObj } : null; // Store a copy
              this.socket._log(`Created filtered handler for ${this.type} with filter:`, newHandler.currentFilter);
             this.filterCache.set(filterKey, newHandler);
             return newHandler;

         }
         return this.filterCache.get(filterKey);
    }

    subscribe(callback) {
        if (typeof callback !== 'function') {
             console.error("[Websim Mock] Subscribe requires a function callback.");
             return () => {};
        }

        const type = this.type;
        const filter = this.currentFilter ? { ...this.currentFilter } : null; // Capture filter state at time of subscription

        if (!this.socket.subscriptions[type]) {
            this.socket.subscriptions[type] = new Set();
        }

        const subscriptionRecord = { callback, filter };
        this.socket.subscriptions[type].add(subscriptionRecord);
        this.socket._log(`Subscribed to ${type} with filter: ${JSON.stringify(filter)}, Total subs: ${this.socket.subscriptions[type].size}`);

        // Immediate callback with current filtered data
        // Use setTimeout to ensure it runs after the current execution context
        setTimeout(() => {
            // Check if still subscribed before firing initial callback
             if (this.socket.subscriptions[type]?.has(subscriptionRecord)) {
                 try {
                    callback(this.getList(filter)); // Use the captured filter
                 } catch (e) { console.error(`[Websim Mock] Error in initial ${type} subscriber callback:`, e); }
             }
        }, 0);


        const unsubscribe = () => {
            if (this.socket.subscriptions[type]) {
                const deleted = this.socket.subscriptions[type].delete(subscriptionRecord);
                 if(deleted) {
                     this.socket._log(`Unsubscribed from ${type} with filter: ${JSON.stringify(filter)}, Remaining subs: ${this.socket.subscriptions[type].size}`);
                     if (this.socket.subscriptions[type].size === 0) {
                         delete this.socket.subscriptions[type];
                          this.socket._log(`Deleted subscription set for ${type}`);
                    }
                 }
            }
        };
        return unsubscribe;
    }
}


// --- Global Initialization ---
// Make WebsimSocket available globally for the app script
window.WebsimSocket = WebsimSocket;
// Instantiate the socket (can be configured here if needed)
window.websim = new WebsimSocket({ logging: true });

// Optional: Add a cleanup function if the environment supports it (e.g., for hot reloading)
window.addEventListener('beforeunload', () => {
    if (window.websim && typeof window.websim.disconnect === 'function') {
        window.websim.disconnect();
    }
});

