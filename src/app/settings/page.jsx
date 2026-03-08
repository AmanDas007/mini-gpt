"use client";

import { ArrowLeft, Sparkles, KeyRound, LogOut, Sun, Moon, Monitor, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner";
import { toast } from "react-hot-toast";
// import axios from "axios";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [theme, setTheme] = useState("dark");
  const [compact, setCompact] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

    useEffect(() => {
      if (status === "unauthenticated") {
        router.push("/login");
      }
    }, [status, router]);

    if (status === "loading") {
      return (
        <Spinner />
      );
    }
  
    // Prevent flash of UI if unauthenticated (wait for redirect)
    if (status === "unauthenticated") {
      return null; 
    }

    const handleLogout = async () => {
      if (isSigningOut) return;
      try {
        setIsSigningOut(true);
        // Show the message
        toast.success("Logged out successfully");
    
        // Perform the logout
        await signOut({ callbackUrl: "/login" });
      } catch (error) {
        toast.error("Something went wrong");
        setIsSigningOut(false);
      }
    };

    const handleDelete = async () => {
      // Prevent double-clicking
      if (isDeleting) return;

      try {
        setIsDeleting(true);
        
        const res = await fetch("/api/delete", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          toast.success("Account and data wiped successfully");
          
          // Crucial: Sign out and redirect to home after deletion
          await signOut({ callbackUrl: "/" });
        } else {
          const errorData = await res.json();
          toast.error(errorData.message || "Failed to delete account");
          setIsDeleting(false);
        }
      } catch (error) {
        console.error("Delete Error:", error);
        toast.error("An unexpected error occurred");
        setIsDeleting(false);
      }
    };

  return (
    <div className="flex-col min-h-screen bg-[#0d0d0f] font-['DM_Sans'] text-gray-200 flex selection:bg-indigo-500/30">
      
      {/* Floating Glassmorphic Nav */}
      <nav className="flex items-center gap-4 px-5 py-3.5 border-b border-white/5 bg-[#0d0d0f]/70 backdrop-blur-xl sticky top-0 z-50 transition-all duration-500">
        <Link 
          href="/chat" 
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/40 group-hover:shadow-indigo-500/30 group-hover:scale-105 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]">
            <Sparkles size={16} className="text-white group-hover:rotate-12 transition-transform duration-500" />
          </div>
          <span className="font-['Syne'] text-white text-xl font-bold tracking-tight opacity-90 group-hover:opacity-100 transition-opacity">Mini-GPT</span>
        </div>
        <span className="text-gray-500 text-sm font-medium ml-1">/ Settings</span>
      </nav>

      <div className="flex-1 overflow-y-auto px-4 py-8 scroll-smooth">
        <div className="max-w-lg mx-auto space-y-8">
          
          {/* Profile card - Animated In */}
          <div className="flex items-center gap-4 bg-[#17171e]/80 backdrop-blur-md border border-white/5 hover:border-white/10 rounded-3xl px-5 py-5 shadow-lg hover:shadow-indigo-500/5 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] animate-in fade-in slide-in-from-bottom-4">
            <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-indigo-500/30 hover:ring-indigo-500/60 hover:scale-105 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]">
              {/* <img src={session.user?.image} className="w-full h-full object-cover"/> */}
              <img 
                src={session.user.image} 
                referrerPolicy="no-referrer" 
                crossOrigin="anonymous" // Add this too for extra compatibility
                className="w-full h-full object-cover" 
                alt="Profile"
              />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-base tracking-wide">{session.user.name}</p>
              <p className="text-indigo-400 text-sm mt-0.5 font-medium">{session.user.email}</p>
            </div>
            {/* <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 font-medium">Free Plan</div> */}
          </div>

          {/* Account Section */}
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] delay-75 fill-mode-both">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-bold px-2 mb-3">Account</p>
            <div className="bg-[#17171e] border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5 shadow-sm">
              
              <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 active:bg-white/10 transition-all duration-200 group cursor-pointer"
                onClick={() => setShowLogoutModal(true)}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/20 group-hover:scale-105 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]">
                  <LogOut size={18} className="text-amber-400" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-gray-200 text-sm font-semibold group-hover:text-white transition-colors">Logout</p>
                  <p className="text-gray-500 text-xs mt-0.5 group-hover:text-gray-400 transition-colors">Sign out of your account</p>
                </div>
              </button>

              {showLogoutModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center px-4 animate-in fade-in duration-300">
                  <div className="bg-[#18181f]/95 border border-white/10 rounded-3xl w-full max-w-sm p-7 shadow-[0_8px_40px_rgb(0,0,0,0.6)] animate-in zoom-in-[0.90] slide-in-from-bottom-4 duration-400 ease-[cubic-bezier(0.23,1,0.32,1)]">
                    <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-inner">
                      <LogOut size={24} className="text-rose-400" />
                    </div>
                    <h3 className="font-['Syne'] text-white text-xl font-bold text-center">Are you sure?</h3>
                    
                    <div className="flex gap-3 mt-8">
                      <button 
                        onClick={() => setShowLogoutModal(false)} 
                        className="cursor-pointer flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300 text-sm font-bold hover:bg-white/10 active:scale-95 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleLogout}
                        disabled={isSigningOut}
                        className={`cursor-pointer flex-1 py-3 rounded-2xl text-white text-sm font-bold active:scale-95 transition-all duration-200 leading-normal ${
                          isSigningOut 
                            ? "bg-rose-800 opacity-70 cursor-not-allowed" 
                            : "bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/40"
                        }`}
                      >
                        {isSigningOut ? "Signing Out..." : "Logout"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Theme Section */}
          {/* <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] delay-150 fill-mode-both">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-bold px-2 mb-3">Preferences</p>
            <div className="bg-[#17171e] border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5 shadow-sm">
              <div className="px-5 py-5">
                <p className="text-gray-200 text-sm font-semibold mb-4">Appearance</p>
                <div className="flex gap-3">
                  {[
                    { id: 'dark', icon: Moon, label: 'Dark' },
                    { id: 'light', icon: Sun, label: 'Light' },
                    { id: 'system', icon: Monitor, label: 'System' }
                  ].map((t) => (
                    <button 
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`flex-1 flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                        theme === t.id 
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10' 
                          : 'border-white/5 hover:border-white/15 bg-white/5'
                      }`}
                    >
                      <t.icon size={20} className={theme === t.id ? 'text-indigo-400' : 'text-gray-400'} />
                      <span className={`text-xs font-semibold ${theme === t.id ? 'text-indigo-400' : 'text-gray-500'}`}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between px-5 py-5 hover:bg-white/[0.02] transition-colors">
                <div>
                  <p className="text-gray-200 text-sm font-semibold">Compact Mode</p>
                  <p className="text-gray-500 text-xs mt-0.5">Reduce spacing in chat interface</p>
                </div>
                <button 
                  onClick={() => setCompact(!compact)}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 active:scale-95 ${compact ? 'bg-indigo-600' : 'bg-[#2a2a35] border border-white/5'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${compact ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
            </div>
          </div> */}

          {/* Danger Zone */}
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] delay-200 fill-mode-both">
            <p className="text-rose-500/80 text-xs uppercase tracking-widest font-bold px-2 mb-3">Danger Zone</p>
            <div className="bg-[#17171e] border border-rose-500/20 rounded-3xl overflow-hidden shadow-sm hover:shadow-rose-500/5 transition-all duration-300">
              <div className="px-5 py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={18} className="text-rose-400" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-200 text-sm font-semibold">Delete Account</p>
                  <p className="text-gray-500 text-xs mt-0.5">Permanently remove your account and all data.</p>
                </div>
              </div>
              <div className="px-5 pb-5">
                <button 
                  onClick={() => setShowDeleteModal(true)} 
                  className="cursor-pointer w-full py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold hover:bg-rose-500 hover:text-white active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                >
                  Delete My Account
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-700 text-xs pb-6 font-medium animate-in fade-in delay-300">Mini-GPT · v1.0.0</p>
        </div>
      </div>

      {/* Glassmorphic Spring-Animated Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center px-4 animate-in fade-in duration-300">
          <div className="bg-[#18181f]/95 border border-white/10 rounded-3xl w-full max-w-sm p-7 shadow-[0_8px_40px_rgb(0,0,0,0.6)] animate-in zoom-in-[0.90] slide-in-from-bottom-4 duration-400 ease-[cubic-bezier(0.23,1,0.32,1)]">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-inner">
              <Trash2 size={24} className="text-rose-400" />
            </div>
            <h3 className="font-['Syne'] text-white text-xl font-bold text-center">Delete Account?</h3>
            <p className="text-gray-400 text-sm text-center mt-2.5 leading-relaxed font-medium">This will permanently delete your account. This action cannot be reversed.</p>
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="cursor-pointer flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300 text-sm font-bold hover:bg-white/10 active:scale-95 transition-all duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className={`cursor-pointer flex-1 py-3 rounded-2xl text-white text-sm font-bold active:scale-95 transition-all duration-200 leading-normal ${
                  isDeleting 
                    ? "bg-rose-800 opacity-70 cursor-not-allowed" 
                    : "bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/40"
                }`}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}