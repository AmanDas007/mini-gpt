"use client";

import { useState } from "react";
import { Mail, Lock, Bot } from "lucide-react";
import Link from "next/link";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SigninPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // 🔐 Credentials Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setMessage("Login successful! Redirecting...");
      setTimeout(() => {
        router.push("/chat");
      }, 1000);
    }
  };

  // 🔵 OAuth Login
  const handleOAuthLogin = async (provider) => {
    setLoading(true);
    setError(null);
    setMessage("Redirecting...");
    await signIn(provider, { callbackUrl: "/chat" });
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-[#161b22] p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-600/20 text-purple-500 mb-4">
            <Bot size={28} />
          </div>
          <h2 className="text-3xl font-bold">Welcome Back</h2>
          <p className="text-gray-400 mt-2">Sign in to continue to Mini-GPT</p>
        </div>

        {/* 🔵 OAuth Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleOAuthLogin("google")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-700 rounded-xl hover:bg-gray-800 transition-all font-medium cursor-pointer"
          >
            <FaGoogle className="w-5 h-5" />
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuthLogin("github")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-700 rounded-xl hover:bg-gray-800 transition-all font-medium cursor-pointer"
          >
            <FaGithub className="w-5 h-5" />
            Continue with GitHub
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <span className="absolute bg-[#161b22] px-3 text-gray-500 text-xs uppercase tracking-widest">
            Or email
          </span>
          <div className="w-full border-t border-gray-800"></div>
        </div>

        {/* 🔐 Credentials Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="relative">
            <Mail
              className="absolute left-3 top-3 text-gray-500"
              size={20}
            />
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            />
          </div>

          <div className="relative">
            <Lock
              className="absolute left-3 top-3 text-gray-500"
              size={20}
            />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-900/20 disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Please wait..." : "Sign In"}
          </button>
        </form>

        {/* 🧠 Smart Message Handling */}
        {error && (
          <div className="text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {message && (
          <div className="text-green-400 text-sm text-center">
            {message}
          </div>
        )}

        <p className="text-center text-gray-400 text-sm">
          New here?{" "}
          <Link
            href="/register"
            className="text-purple-500 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}