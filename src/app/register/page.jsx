"use client";

import { useState } from "react";
import { Eye, EyeOff, User, Mail, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setMessage(null);

    if (password !== confirm) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);

      const res = await axios.post("/api/register", {
        name,
        email,
        password,
      });

      setMessage(res.data?.message || "Account created successfully!");

      // Redirect after 1.5s
      setTimeout(() => {
        router.push("/pricing");
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-[#161b22] p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 text-blue-500 mb-4">
            <Sparkles size={28} />
          </div>
          <h2 className="text-3xl font-bold">Create Account</h2>
          <p className="text-gray-400 mt-2">
            Start your journey with Mini-GPT
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-xl py-2.5 pl-10 pr-12 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 cursor-pointer"
            >
              {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm Password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-xl py-2.5 pl-10 pr-12 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 cursor-pointer"
            >
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {/* Smart Messages */}
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
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-500 hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}