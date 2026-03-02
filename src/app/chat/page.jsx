"use client";

import { useState } from "react";
import { Menu, Plus, MessageSquare, User, X, Send, Bot, Sparkles } from "lucide-react";
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

    // Dummy AI reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm your Mini-GPT assistant. How can I help you build your project today?" },
      ]);
    }, 800);
  };

  return (
    <div className="flex h-screen bg-[#0b0e14] text-gray-100">
      
      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? "w-72" : "w-0"} 
        bg-[#0d1117] border-r border-gray-800 transition-all duration-300 
        overflow-hidden flex flex-col`}
      >
        <div className="p-4">
          <button className="w-full flex items-center justify-center gap-2 bg-[#161b22] border border-gray-700 rounded-xl p-3 hover:bg-[#1c2128] hover:border-gray-600 transition-all font-medium text-sm">
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 mt-4">Recent Chats</p>
          {["Mini-GPT project ideas", "Next.js Help", "MongoDB Connection"].map(
            (session, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#161b22] text-sm text-gray-400 hover:text-white transition-colors text-left group"
              >
                <MessageSquare className="w-4 h-4 text-gray-600 group-hover:text-blue-500" /> 
                <span className="truncate">{session}</span>
              </button>
            )
          )}
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-800">
          <Link
            href="/settings"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#161b22] transition-all border border-transparent hover:border-gray-700"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">My Account</span>
              <span className="text-[10px] text-gray-500">Free Plan</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-[#0b0e14]">

        {/* Header */}
        <header className="p-4 flex items-center justify-between border-b border-gray-800 bg-[#0b0e14]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-[#161b22] rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="ml-4 flex items-center gap-2">
               <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <Bot size={14} className="text-white" />
               </div>
               <span className="font-bold text-sm tracking-tight">Mini GPT <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded ml-1 text-gray-400">v1.0</span></span>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-gray-600 hover:text-yellow-500 cursor-pointer transition-colors" />
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto pt-10 pb-32">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
               <div className="w-16 h-16 bg-[#161b22] border border-gray-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                  <Bot size={32} className="text-blue-500" />
               </div>
               <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                 How can I help you today?
               </h2>
               <p className="text-gray-500 max-w-sm">Ask me to write code, summarize text, or brainstorm ideas for your Mini-GPT project.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`w-full py-6 ${msg.role === "assistant" ? "bg-[#161b22]/30 border-y border-gray-800/50" : ""}`}
                >
                  <div className="max-w-3xl mx-auto px-4 md:px-0 flex gap-4 md:gap-6">
                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                      msg.role === "user" ? "bg-gray-700" : "bg-blue-600 shadow-lg shadow-blue-900/20"
                    }`}>
                      {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className="flex-1 space-y-2 leading-relaxed text-gray-200">
                      <p className="font-bold text-xs text-gray-500 uppercase tracking-wider">
                        {msg.role === "user" ? "You" : "Mini GPT"}
                      </p>
                      <div className="prose prose-invert max-w-none text-sm md:text-base">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Input Field */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0b0e14] via-[#0b0e14] to-transparent pt-10 pb-6 px-4">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
            <div className="relative">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="w-full bg-[#161b22] border border-gray-700 rounded-2xl py-4 pl-5 pr-14 shadow-2xl focus:outline-none focus:border-gray-500 text-gray-100 placeholder-gray-500 transition-all"
                placeholder="Message Mini-GPT..."
              />
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white text-black rounded-xl hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-600 transition-all shadow-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-600 mt-3">
              Mini GPT can make mistakes. Check important info.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}