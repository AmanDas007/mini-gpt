"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import { FaGoogle, FaGithub } from "react-icons/fa";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCredentialsAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (res?.error) {
      alert("Invalid credentials");
    } else {
      window.location.href = "/";
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
        </div>

        <div className="space-y-4">

          {/* Google Login */}
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <FaGoogle className="w-5 h-5" />
            <span>Continue with Google</span>
          </button>

          {/* GitHub Login */}
          <button
            onClick={() => signIn("github")}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <FaGithub className="w-5 h-5" />
            <span>Continue with GitHub</span>
          </button>

          <div className="relative flex items-center justify-center py-2">
            <span className="absolute bg-white px-2 text-gray-500 text-sm">Or</span>
            <div className="w-full border-t border-gray-200"></div>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleCredentialsAuth} className="space-y-4">
            
            {!isLogin && (
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : isLogin
                ? "Sign In"
                : "Sign Up"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600">
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-medium hover:underline"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}