"use client";

import { CreditCard, LogOut, Shield, Palette, ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function SettingsPage() {
  const options = [
    {
      icon: CreditCard,
      label: "Manage Subscription",
      desc: "View billing and upgrade plans",
      href: "/pricing",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: Shield,
      label: "Account Security",
      desc: "Change password and enable 2FA",
      href: "/security",
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      icon: Palette,
      label: "Theme Customization",
      desc: "Light, Dark, and System modes",
      href: "/theme",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-[#161b22] rounded-2xl border border-gray-800 shadow-2xl p-6 md:p-8">
        
        {/* Back Button */}
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Chat</span>
        </Link>

        <header className="mb-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-gray-500 mt-2">Manage your account preferences and subscription</p>
        </header>

        <div className="space-y-4">
          {/* Settings Options */}
          {options.map((opt) => {
            const Icon = opt.icon;

            return (
              <Link
                key={opt.label}
                href={opt.href}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-[#0d1117] border border-gray-800 hover:border-gray-600 hover:bg-[#1c2128] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-lg ${opt.bg} ${opt.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-200 group-hover:text-white transition-colors">
                      {opt.label}
                    </p>
                    <p className="text-sm text-gray-500">{opt.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-300 transition-colors" />
              </Link>
            );
          })}

          <div className="pt-4 mt-6 border-t border-gray-800">
            {/* Logout Button */}
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 font-semibold"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}