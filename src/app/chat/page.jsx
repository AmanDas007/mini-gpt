"use client";

import { useState } from "react";
import { Menu, Plus, MessageSquare, User, X, Send } from "lucide-react";
import Link from "next/link";

export default function ChatPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const handleSend = () => {
    if (!message.trim()) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: message },
    ]);

    setMessage("");

    // Dummy AI reply (replace with backend call later)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "This is a demo AI response." },
      ]);
    }, 800);
  };

  return (
    <div className="flex h-screen bg-white text-gray-800">

      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? "w-64" : "w-0"} 
        bg-gray-900 text-white transition-all duration-300 
        overflow-hidden flex flex-col`}
      >
        <div className="p-4">
          <button className="w-full flex items-center gap-3 border border-gray-700 rounded-lg p-3 hover:bg-gray-800 transition">
            <Plus className="w-5 h-5" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {["Mini-GPT project ideas", "Next.js Help", "MongoDB Connection"].map(
            (session, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-sm text-gray-300 text-left"
              >
                <MessageSquare className="w-4 h-4" /> {session}
              </button>
            )
          )}
        </div>

        <div className="p-4 border-t border-gray-800">
          <Link
            href="/settings"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <span className="text-sm">My Account</span>
          </Link>
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col relative h-full">

        {/* Header */}
        <header className="p-4 flex items-center border-b">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
          <span className="ml-4 font-semibold text-lg">Mini GPT</span>
        </header>

        {/* Messages */}
        <div className="flex-1 p-4 md:px-20 overflow-y-auto space-y-6">
          {messages.length === 0 && (
            <div className="max-w-3xl mx-auto text-center mt-20 text-gray-400">
              <h2 className="text-2xl font-bold mb-2">
                How can I help you today?
              </h2>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-3xl mx-auto flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-3 rounded-2xl text-sm ${
                  msg.role === "user"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t md:border-none md:pb-10">
          <div className="max-w-3xl mx-auto relative">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="w-full border rounded-2xl py-4 pl-4 pr-12 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              placeholder="Message Mini-GPT..."
            />
            <button
              onClick={handleSend}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-gray-900 text-white rounded-xl hover:bg-gray-700"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}