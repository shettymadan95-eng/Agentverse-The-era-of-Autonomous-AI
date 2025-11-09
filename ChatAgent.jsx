// ChatAgent.jsx
import React, { useState } from "react";

function ChatAgent() {
  const [input, setInput] = useState("");
  
  const [messages, setMessages] = useState([]);

  // Change the endpoint to your deployed agent backend
  const backendURL = "http://localhost:8000/chat";

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");

    try {
      const res = await fetch(backendURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "agent", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: "Agent service is not available." },
      ]);
    }
  };

  return (
    <div style={{ width: 400, margin: "0 auto" }}>
      <div style={{ height: 400, overflowY: "auto", border: "1px solid #ccc", padding: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.role === "user" ? "right" : "left" }}>
            <b>{msg.role === "user" ? "You" : "Agent"}: </b>{msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} style={{ marginTop: 10, display: "flex" }}>
        <input
          style={{ flex: 1, padding: 8 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
        />
        <button type="submit" style={{ marginLeft: 8 }}>Send</button>
      </form>
    </div>
  );
}

export default ChatAgent;