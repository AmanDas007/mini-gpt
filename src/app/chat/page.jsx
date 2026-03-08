"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, Plus, MessageSquare, User, X, Send, Bot, Sparkles, LogOut, Settings, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner";
import { toast } from "react-hot-toast";

// Markdown & Syntax Highlighting Imports
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// --- CUSTOM CODE BLOCK COMPONENT ---
const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-white/10">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e2e] border-b border-white/5">
        <span className="text-xs font-mono text-gray-400">{language || 'code'}</span>
        <button 
          onClick={copyToClipboard}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        customStyle={{ margin: 0, padding: '1.5rem', background: '#0d0d0f', fontSize: '13px' }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

const PaginationSpinner = () => (
  <div className="flex items-center justify-center py-4 animate-in fade-in duration-300">
    <div className="w-5 h-5 border-2 border-white/10 border-t-white/80 rounded-full animate-spin"></div>
  </div>
);

export default function ChatPage() {
  // Auth & Routing
  const { data: session, status } = useSession();
  const router = useRouter();

  // Chat States
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false); // For Pagination Spinner
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const fetchMessages = async (pageNum) => {
    if (!session?.user?.id) return;
    
    if (pageNum > 1) setIsFetchingMore(true);

    try {
      const res = await fetch(`/api/chat/get-messages?userId=${session.user.id}&page=${pageNum}`);
      const data = await res.json();
      
      if (data.length < 20) setHasMore(false);

      if (pageNum === 1) {
        setMessages(data);
        // Instant scroll for the first load
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "instant" }), 100);
      } else {
        // --- PREVENT SCROLL JUMP ---
        const container = scrollContainerRef.current;
        
        // 1. Capture the exact scroll height BEFORE adding new messages
        const scrollHeightBefore = container.scrollHeight;

        // 2. Prepend the new messages
        setMessages((prev) => [...data, ...prev]);

        // 3. Use a micro-task to adjust scroll before the browser repaints
        // This makes the transition invisible to the user
        requestAnimationFrame(() => {
          if (container) {
            const scrollHeightAfter = container.scrollHeight;
            // 4. Calculate the difference (how much height was added to the top)
            const heightAdded = scrollHeightAfter - scrollHeightBefore;
            // 5. Instantly move the scroll bar down by that exact amount
            container.scrollTop = heightAdded;
          }
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoadingInitial(false);
      setIsFetchingMore(false);
    }
  };

  // Authentication Check
  useEffect(() => {
    if (status === "authenticated") fetchMessages(1);
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Auto-scroll
  useEffect(() => {
    if (!isLoadingInitial && page === 1 && !isFetchingMore) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isThinking]);

  const loadMore = () => {
    if (isFetchingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMessages(nextPage);
  };

  // --- UPDATED HANDLESEND LOGIC FOR STREAMING BACKEND ---
  const handleSend = async () => {
    if (!message.trim()) return;

    const currentMessage = message;

    // 1. Instantly show user message and clear input
    setMessages((prev) => [...prev, { role: "user", content: currentMessage }]);
    setMessage("");
    setIsThinking(true); // Show the "Thinking..." liquid animation

    try {
      // 2. Call your backend API
      const response = await fetch("/api/chat/on-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentMessage,
          userId: session.user.id,
        }),
      });

      // Handle Daily Limit from backend
      if (!response.ok) {
        setIsThinking(false);
        if (response.status === 403) {
           setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Daily limit reached. Please try again tomorrow or upgrade your plan." }]);
           return;
        }
        throw new Error("Failed to fetch response");
      }

      // 3. Remove thinking animation and prepare empty assistant bubble
      setIsThinking(false);
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      // 4. Read the streamed response chunk by chunk
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let text = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          text += chunk;
          
          // Update the very last message in the array with the new text chunk
          setMessages((prev) => {
            const updatedMessages = [...prev];
            updatedMessages[updatedMessages.length - 1].content = text;
            return updatedMessages;
          });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setIsThinking(false);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error connecting to the server. Please try again." }]);
    }
  };

  const handleClearChat = async () => {
    if (isClearing) return;
  
    const clearPromise = async () => {
      setIsClearing(true);
      const res = await fetch("/api/chat/delete-all", {
        method: "POST", // Changed from GET to match your backend
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });
  
      if (!res.ok) throw new Error("Failed to clear chats");
      
      setMessages([]);
      setIsClearing(false);
      return res;
    };
  
    toast.promise(clearPromise(), {
      loading: 'Clearing conversation...',
      success: 'Chat history wiped! ✨',
      error: 'Failed to clear chat. ❌',
    }, {
      style: {
        background: '#18181f',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '1rem',
      }
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Message copied!", {
      style: { background: '#18181f', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
    });
  };

  // --- LOADING STATE (3-Layer Rotator) ---
  // if (status === "loading") {
  //   return (
  //     <Spinner />
  //   );
  // }
  if (status === "loading" || (status === "authenticated" && isLoadingInitial)) {
    return (
      <div className="h-screen bg-[#0d0d0f] flex items-center justify-center">
        <Spinner /> 
      </div>
    );
  }

  // Prevent flash of UI if unauthenticated (wait for redirect)
  // if (status === "unauthenticated") {
  //   return null; 
  // }

  // --- MAIN AUTHENTICATED UI (Untouched) ---
  return (
    <div className="flex h-screen bg-[#0d0d0f] font-['DM_Sans'] text-gray-200 selection:bg-indigo-500/30">
    
      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-[#0d0d0f]">
        
        {/* Floating Glassmorphic Header */}
        <nav className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-[#0d0d0f]/70 backdrop-blur-xl sticky top-0 z-50 transition-all duration-500">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/40 group-hover:shadow-indigo-500/30 group-hover:scale-105 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]">
              <Sparkles size={18} className="text-white group-hover:rotate-12 transition-transform duration-500" />
            </div>
            <span className="font-['Syne'] text-white text-xl font-bold tracking-tight opacity-90 group-hover:opacity-100 transition-opacity">Mini-GPT</span>
          </div>

          <div className="flex items-center gap-4 relative">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/10 hover:ring-indigo-500/50 hover:scale-105 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]">
              <img 
                src={session.user.image} 
                referrerPolicy="no-referrer" 
                crossOrigin="anonymous" // Add this too for extra compatibility
                alt="User" 
                className="w-full h-full object-cover"
              />
            </div>
            <button 
              onClick={() => setMenuOpen(!menuOpen)} 
              className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-300"
            >
               <Menu size={18} className={menuOpen ? "rotate-90 transition-transform duration-300" : "transition-transform duration-300"} />
            </button>
            
            {/* Framer-style Popover Menu */}
            {menuOpen && (
              <div className="absolute right-0 top-14 w-52 bg-[#18181f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden z-50 animate-in fade-in zoom-in-[0.95] slide-in-from-top-2 origin-top-right duration-200 ease-out p-1">
                <Link href="/settings" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-indigo-500/10 hover:text-indigo-300 active:scale-[0.98] transition-all">
                  <Settings size={16} /> Go to Settings
                </Link>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-1"></div>
                <button 
                  onClick={() => {
                    handleClearChat(); 
                    setMenuOpen(false);}
                  } 
                  className="cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-rose-500/10 hover:text-rose-400 active:scale-[0.98] transition-all">
                  <X size={16} /> Clear Chat
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Messages List */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-8 space-y-6 scroll-smooth">
          <div className="min-h-[50px] flex items-center justify-center">
            {isFetchingMore ? (
              <PaginationSpinner />
            ) : (
              hasMore && messages.length >= 20 && (
                <button 
                  onClick={loadMore} 
                  className="cursor-pointer text-xs text-gray-500 hover:text-indigo-400 py-2 px-4 rounded-full border border-white/5 hover:bg-white/5 transition-all"
                >
                  Load older messages
                </button>
              )
            )}
          </div>
          
          {messages.length === 0 && !isThinking ? (
            <div className="flex justify-center mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* ... existing "How can I help" UI ... */}
            </div>
          ) : (
            <div className="space-y-6 pb-24">
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'assistant' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                  <div className={`w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-1 flex items-center justify-center shadow-md ${msg.role === 'assistant' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20' : 'ring-2 ring-white/10'}`}>
                    {msg.role === 'assistant' ? <Sparkles size={14} className="text-white"/> : <img src={session.user.image} referrerPolicy="no-referrer" crossOrigin="anonymous" className="w-full h-full object-cover"/>}
                  </div>
                  
                  {/* ADDED 'group' and 'relative' HERE */}
                  <div className={`group relative px-5 py-3.5 text-[15px] leading-relaxed max-w-[85%] transition-all ${
                    msg.role === 'assistant' 
                      ? 'bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl rounded-tr-sm text-gray-200 hover:border-indigo-500/40' 
                      : 'bg-[#17171e] border border-white/5 rounded-2xl rounded-tl-sm text-gray-200 hover:bg-[#1a1a24]'
                  }`}>
                    
                    {/* FLOATING COPY BUTTON */}
                    <button 
                      onClick={() => copyToClipboard(msg.content)}
                      className="absolute -top-3 -right-3 p-2 rounded-xl bg-[#1e1e2e] border border-white/10 text-gray-400 opacity-0 group-hover:opacity-100 transition-all hover:text-white hover:scale-110 shadow-2xl z-10 cursor-pointer"
                      title="Copy message"
                    >
                      <Copy size={14} />
                    </button>

                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <CodeBlock 
                              language={match[1]} 
                              value={String(children).replace(/\n$/, '')} 
                            />
                          ) : (
                            <code className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-sm" {...props}>
                              {children}
                            </code>
                          );
                        },
                        ul: ({ children }) => <ul className="list-disc ml-4 space-y-1 my-2 text-gray-300">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal ml-4 space-y-1 my-2 text-gray-300">{children}</ol>,
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        a: ({ children, href }) => <a href={href} target="_blank" className="text-indigo-400 hover:underline font-medium">{children}</a>
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}

              {/* Framer-style Liquid Typing Indicator */}
              {isThinking && (
                <div className="flex gap-4 max-w-3xl mx-auto flex-row-reverse animate-in fade-in slide-in-from-bottom-4 duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 mt-1 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Sparkles size={14} className="text-white animate-pulse"/>
                  </div>
                  <div className="bg-[#17171e] border border-white/5 rounded-2xl rounded-tr-sm px-5 py-4 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_0ms]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_150ms]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-[bounce_1s_infinite_300ms]"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Framer-style Floating Input Area */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0d0d0f] via-[#0d0d0f] to-transparent pt-12 pb-6 px-4">
          <div className="max-w-3xl mx-auto relative group">
            {/* Animated Glow Behind Input */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-0 group-focus-within:opacity-20 transition duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"></div>
            
            <div className="relative flex items-end gap-3 bg-[#17171e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl group-focus-within:-translate-y-1 group-focus-within:border-indigo-500/30 group-focus-within:shadow-indigo-500/10 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                disabled={isThinking}
                rows={1}
                className="flex-1 bg-transparent text-[15px] text-gray-200 placeholder-gray-500 resize-none leading-relaxed focus:outline-none max-h-40 disabled:opacity-50 py-3 pl-4"
                placeholder="Message Mini-GPT..."
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || isThinking}
                className="w-10 h-10 mb-1 flex-shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-gray-500 flex items-center justify-center active:scale-90 hover:scale-105 transition-all duration-300 shadow-md shadow-indigo-900/40 text-white"
              >
                <Send size={16} className="ml-0.5" />
              </button>
            </div>
            <p className="text-center text-gray-600 text-xs mt-3 font-medium opacity-70">Mini-GPT can make mistakes. Use with care.</p>
          </div>
        </div>
      </main>
    </div>
  );
}