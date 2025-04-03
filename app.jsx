import { jsxDEV } from "react/jsx-dev-runtime";
const { useState, useEffect, useRef, useSyncExternalStore, useMemo } = React;
const { DateTime } = luxon;
const ReactMarkdown = window.ReactMarkdown?.default || window.ReactMarkdown;
const room = new WebsimSocket();
const DEBATE_COLLECTION = "debate_v1";
const MESSAGE_COLLECTION = "message_v1";
const HISTORY_LIMIT = 10;
const formatTimestamp = (timestamp) => {
  try {
    return DateTime.fromISO(timestamp).toLocaleString(DateTime.DATETIME_SHORT);
  } catch (e) {
    console.error("Error formatting timestamp:", e);
    return "Invalid date";
  }
};
const App = () => {
  const [currentDebateId, setCurrentDebateId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const subscribeDebates = useMemo(() => room.collection(DEBATE_COLLECTION).subscribe, []);
  const getDebates = useMemo(() => room.collection(DEBATE_COLLECTION).getList, []);
  const debates = useSyncExternalStore(subscribeDebates, getDebates, getDebates);
  useEffect(() => {
    const latestActiveDebate = debates.find((d) => d.active !== false);
    if (latestActiveDebate) {
      setCurrentDebateId(latestActiveDebate.id);
    } else {
      setCurrentDebateId(null);
    }
  }, [debates]);
  const handleCreateDebate = async (topic, aiPersona1, aiPersona2) => {
    setLoading(true);
    setError(null);
    try {
      const newDebate = await room.collection(DEBATE_COLLECTION).create({
        topic,
        aiPersona1,
        aiPersona2,
        active: true
        // Mark the new debate as active
      });
    } catch (err) {
      console.error("Error creating debate:", err);
      setError("Failed to create debate. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleResetDebate = async () => {
    if (!currentDebateId) return;
    setLoading(true);
    setError(null);
    try {
      await room.collection(DEBATE_COLLECTION).update(currentDebateId, { active: false });
    } catch (err) {
      console.error("Error resetting debate (marking inactive):", err);
      setCurrentDebateId(null);
      setError("Failed to mark debate as inactive. You might not be the creator. Resetting locally.");
    } finally {
      setLoading(false);
    }
  };
  const currentDebate = useMemo(() => debates.find((d) => d.id === currentDebateId), [debates, currentDebateId]);
  return /* @__PURE__ */ jsxDEV("div", { className: "container", children: [
    /* @__PURE__ */ jsxDEV("h1", { children: "AI Debate Club" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 98,
      columnNumber: 13
    }),
    error && /* @__PURE__ */ jsxDEV("div", { className: "error", children: [
      "Error: ",
      error,
      /* @__PURE__ */ jsxDEV("button", { onClick: () => setError(null), children: "Dismiss" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 102,
        columnNumber: 21
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 100,
      columnNumber: 17
    }),
    loading && !currentDebateId && /* @__PURE__ */ jsxDEV("div", { className: "loading", children: /* @__PURE__ */ jsxDEV("div", { className: "spinner" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 105,
      columnNumber: 70
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 105,
      columnNumber: 45
    }),
    !currentDebateId && !loading && /* @__PURE__ */ jsxDEV(DebateSetup, { onCreateDebate: handleCreateDebate, isLoading: loading }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 108,
      columnNumber: 18
    }),
    currentDebateId && currentDebate && /* @__PURE__ */ jsxDEV(
      DebateInterface,
      {
        debate: currentDebate,
        onResetDebate: handleResetDebate
      },
      currentDebateId,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 112,
        columnNumber: 17
      }
    ),
    !currentDebateId && debates.length > 0 && !loading && /* @__PURE__ */ jsxDEV("div", { className: "info-text", children: "No active debate found. You can start a new one." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 119,
      columnNumber: 17
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 97,
    columnNumber: 9
  });
};
const DebateSetup = ({ onCreateDebate, isLoading }) => {
  const [topic, setTopic] = useState("");
  const [aiPersona1, setAiPersona1] = useState("");
  const [aiPersona2, setAiPersona2] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim() || !aiPersona1.trim() || !aiPersona2.trim()) {
      alert("Please fill in all fields.");
      return;
    }
    onCreateDebate(topic.trim(), aiPersona1.trim(), aiPersona2.trim());
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "debate-setup", children: [
    /* @__PURE__ */ jsxDEV("h2", { children: "Start a New Debate" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 141,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("form", { onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
        /* @__PURE__ */ jsxDEV("label", { htmlFor: "topic", children: "Debate Topic:" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 144,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "text",
            id: "topic",
            value: topic,
            onChange: (e) => setTopic(e.target.value),
            placeholder: "e.g., Is remote work the future?",
            required: true,
            disabled: isLoading,
            maxLength: 150
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 145,
            columnNumber: 21
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 143,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
        /* @__PURE__ */ jsxDEV("label", { htmlFor: "aiPersona1", children: "AI Persona 1 (e.g., Proponent):" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 157,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV(
          "textarea",
          {
            id: "aiPersona1",
            value: aiPersona1,
            onChange: (e) => setAiPersona1(e.target.value),
            placeholder: "e.g., A tech CEO advocating for full remote flexibility.",
            required: true,
            disabled: isLoading,
            maxLength: 300,
            rows: 3
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 158,
            columnNumber: 21
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 156,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "form-group", children: [
        /* @__PURE__ */ jsxDEV("label", { htmlFor: "aiPersona2", children: "AI Persona 2 (e.g., Opponent):" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 170,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV(
          "textarea",
          {
            id: "aiPersona2",
            value: aiPersona2,
            onChange: (e) => setAiPersona2(e.target.value),
            placeholder: "e.g., An office manager emphasizing the importance of in-person collaboration.",
            required: true,
            disabled: isLoading,
            maxLength: 300,
            rows: 3
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 171,
            columnNumber: 21
          }
        )
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 169,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("button", { type: "submit", className: "button", disabled: isLoading, children: isLoading ? "Starting..." : "Start Debate" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 182,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 142,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 140,
    columnNumber: 9
  });
};
const DebateInterface = ({ debate, onResetDebate }) => {
  const { id: debateId, topic, aiPersona1, aiPersona2 } = debate;
  const [newMessage, setNewMessage] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [localError, setLocalError] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const messageFilter = useMemo(() => ({ debate_id: debateId }), [debateId]);
  const subscribeMessages = useMemo(() => {
    return (callback) => room.collection(MESSAGE_COLLECTION).filter(messageFilter).subscribe(callback);
  }, [messageFilter]);
  const getMessagesSnapshot = useMemo(() => {
    return () => room.collection(MESSAGE_COLLECTION).filter(messageFilter).getList();
  }, [messageFilter]);
  const messages = useSyncExternalStore(
    subscribeMessages,
    getMessagesSnapshot,
    getMessagesSnapshot
    // Server snapshot (optional, can be same as client)
  );
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
      const maxHeight = parseInt(window.getComputedStyle(textarea).maxHeight, 10);
      if (maxHeight && scrollHeight > maxHeight) {
        textarea.style.overflowY = "auto";
      } else {
        textarea.style.overflowY = "hidden";
      }
    }
  }, [newMessage]);
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || isAiResponding) return;
    const userMessageContent = newMessage.trim();
    setNewMessage("");
    setIsAiResponding(true);
    setLocalError(null);
    try {
      await room.collection(MESSAGE_COLLECTION).create({
        debate_id: debateId,
        role: "user",
        content: userMessageContent
      });
      const currentMessages = room.collection(MESSAGE_COLLECTION).filter({ debate_id: debateId }).getList().slice(0, HISTORY_LIMIT).reverse();
      const historyForLlm = [...currentMessages];
      if (!historyForLlm.find((m) => m.content === userMessageContent && m.role === "user")) {
        historyForLlm.push({ role: "user", content: userMessageContent });
      }
      const lastMessage = currentMessages.length > 0 ? currentMessages[currentMessages.length - 1] : null;
      const nextAiRole = !lastMessage || lastMessage.role === "ai_2" || lastMessage.role === "user" ? "ai_1" : "ai_2";
      const nextAiPersona = nextAiRole === "ai_1" ? aiPersona1 : aiPersona2;
      const opponentPersona = nextAiRole === "ai_1" ? aiPersona2 : aiPersona1;
      const systemPrompt = `You are in a debate on "${topic}". Your persona: "${nextAiPersona}". Your opponent: "${opponentPersona}". Respond concisely, in character, addressing previous points. Use Markdown for formatting.`;
      const llmMessages = [
        { role: "system", content: systemPrompt },
        // Map db messages to {role, content} format
        ...historyForLlm.map((msg) => ({ role: msg.role, content: msg.content }))
      ];
      const completion = await websim.chat.completions.create({ messages: llmMessages });
      const aiResponseContent = completion.content;
      if (aiResponseContent) {
        await room.collection(MESSAGE_COLLECTION).create({
          debate_id: debateId,
          role: nextAiRole,
          // 'ai_1' or 'ai_2'
          content: aiResponseContent,
          persona: nextAiPersona
          // Store persona for display clarity if needed
        });
      } else {
        throw new Error("AI returned empty response.");
      }
    } catch (err) {
      console.error("Error during message send/AI response:", err);
      setLocalError(`An error occurred: ${err.message || "Could not get AI response."}. Please try again.`);
    } finally {
      setIsAiResponding(false);
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
      });
    }
  };
  const displayedMessages = useMemo(() => [...messages].reverse(), [messages]);
  return /* @__PURE__ */ jsxDEV("div", { className: "debate-interface", children: [
    /* @__PURE__ */ jsxDEV("h2", { children: topic }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 333,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "debate-info", children: [
      /* @__PURE__ */ jsxDEV("p", { children: [
        /* @__PURE__ */ jsxDEV("strong", { children: "AI Persona 1:" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 335,
          columnNumber: 20
        }),
        " ",
        aiPersona1
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 335,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("p", { children: [
        /* @__PURE__ */ jsxDEV("strong", { children: "AI Persona 2:" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 336,
          columnNumber: 20
        }),
        " ",
        aiPersona2
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 336,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 334,
      columnNumber: 13
    }),
    localError && /* @__PURE__ */ jsxDEV("div", { className: "error", style: { margin: `0 0 ${"var(--spacing-md)"} 0` }, children: [
      " ",
      localError,
      /* @__PURE__ */ jsxDEV("button", { onClick: () => setLocalError(null), children: "Dismiss" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 341,
        columnNumber: 21
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 339,
      columnNumber: 17
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "messages", children: [
      displayedMessages.length === 0 && !isAiResponding && /* @__PURE__ */ jsxDEV("p", { className: "info-text", children: "The debate is ready. Send the first message!" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 346,
        columnNumber: 21
      }),
      displayedMessages.map((msg) => /* @__PURE__ */ jsxDEV(Message, { message: msg, debate }, msg.id, false, {
        fileName: "<stdin>",
        lineNumber: 349,
        columnNumber: 21
      })),
      isAiResponding && // Show placeholder while AI is typing
      /* @__PURE__ */ jsxDEV(MessageLoadingPlaceholder, { role: (
        // Guess next role for placeholder
        messages.length === 0 || messages[0].role === "ai_2" || messages[0].role === "user" ? "ai_1" : "ai_2"
      ), debate }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 352,
        columnNumber: 21
      }),
      /* @__PURE__ */ jsxDEV("div", { ref: messagesEndRef }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 356,
        columnNumber: 17
      }),
      " "
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 344,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("form", { className: "message-form", onSubmit: handleSendMessage, children: [
      /* @__PURE__ */ jsxDEV(
        "textarea",
        {
          ref: textareaRef,
          className: "message-input",
          value: newMessage,
          onChange: (e) => setNewMessage(e.target.value),
          placeholder: isAiResponding ? "AI is responding..." : "Your argument...",
          rows: "1",
          disabled: isAiResponding,
          onKeyDown: (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 360,
          columnNumber: 17
        }
      ),
      /* @__PURE__ */ jsxDEV("button", { type: "submit", className: "send-button", disabled: isAiResponding || !newMessage.trim(), children: isAiResponding ? /* @__PURE__ */ jsxDEV("div", { className: "spinner", style: { width: "20px", height: "20px", borderWidth: "2px", margin: "0 auto", borderLeftColor: "white" } }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 377,
        columnNumber: 39
      }) : "Send" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 376,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 359,
      columnNumber: 13
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "debate-actions", children: /* @__PURE__ */ jsxDEV("button", { onClick: onResetDebate, className: "button reset-button", disabled: isAiResponding, children: "End & Reset Debate" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 381,
      columnNumber: 18
    }) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 380,
      columnNumber: 14
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 332,
    columnNumber: 9
  });
};
const Message = ({ message, debate }) => {
  const { username, role, content, created_at, persona } = message;
  const isUser = role === "user";
  const isAi = role === "ai_1" || role === "ai_2";
  let displayName = "Unknown";
  let avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=Unknown`;
  let messageClass = "message";
  let title = "";
  if (isUser) {
    displayName = username || "User";
    avatarUrl = `https://images.websim.ai/avatar/${username}`;
    messageClass += " user";
    title = `User: ${displayName}`;
  } else if (isAi) {
    const aiNum = role === "ai_1" ? 1 : 2;
    const aiPersona = role === "ai_1" ? debate.aiPersona1 : debate.aiPersona2;
    const shortPersona = aiPersona?.split(/[,.\s]/)[0] || `AI ${aiNum}`;
    displayName = `AI ${aiNum} (${shortPersona})`;
    avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(aiPersona || role)}&radius=50&backgroundColor=c0aede,bbf7d0,fecdd3,fef08a`;
    messageClass += " ai";
    title = `AI ${aiNum}: ${aiPersona || "N/A"}`;
  }
  return /* @__PURE__ */ jsxDEV("div", { className: messageClass, title, children: [
    /* @__PURE__ */ jsxDEV(
      "img",
      {
        src: avatarUrl,
        alt: `${displayName} avatar`,
        className: "message-avatar",
        onError: (e) => {
          e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${displayName.charAt(0)}`;
        }
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 419,
        columnNumber: 13
      }
    ),
    /* @__PURE__ */ jsxDEV("div", { className: "message-content", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "message-header", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "message-username", children: displayName }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 428,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("span", { className: "message-timestamp", children: formatTimestamp(created_at) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 429,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 427,
        columnNumber: 17
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "message-text", children: /* @__PURE__ */ jsxDEV(ReactMarkdown, { children: String(content || "") }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 433,
        columnNumber: 21
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 432,
        columnNumber: 18
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 426,
      columnNumber: 13
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 418,
    columnNumber: 9
  });
};
const MessageLoadingPlaceholder = ({ role, debate }) => {
  const isAi1 = role === "ai_1";
  const persona = isAi1 ? debate.aiPersona1 : debate.aiPersona2;
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(persona || role)}&radius=50&backgroundColor=c0aede,bbf7d0,fecdd3,fef08a`;
  const displayName = isAi1 ? `AI 1 (${persona?.split(/[,.\s]/)[0] || "AI 1"})` : `AI 2 (${persona?.split(/[,.\s]/)[0] || "AI 2"})`;
  return /* @__PURE__ */ jsxDEV("div", { className: "message ai", children: [
    /* @__PURE__ */ jsxDEV("img", { src: avatarUrl, alt: "AI avatar", className: "message-avatar" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 449,
      columnNumber: 14
    }),
    /* @__PURE__ */ jsxDEV("div", { className: "message-content", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "message-header", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "message-username", children: displayName }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 452,
          columnNumber: 21
        }),
        /* @__PURE__ */ jsxDEV("span", { className: "message-timestamp", children: "Responding..." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 453,
          columnNumber: 21
        })
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 451,
        columnNumber: 18
      }),
      /* @__PURE__ */ jsxDEV("div", { className: "message-text", style: { display: "flex", alignItems: "center", height: "30px" }, children: /* @__PURE__ */ jsxDEV("div", { className: "spinner" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 456,
        columnNumber: 21
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 455,
        columnNumber: 17
      })
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 450,
      columnNumber: 14
    })
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 448,
    columnNumber: 9
  });
};
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
  fileName: "<stdin>",
  lineNumber: 465,
  columnNumber: 13
}));
