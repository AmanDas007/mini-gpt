"use client";

import { CreditCard, LogOut, Shield, Palette, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function SettingsPage() {
  const options = [
    {
      icon: CreditCard,
      label: "Manage Subscription",
      desc: "View billing and upgrade plans",
      href: "/pricing",
    },
    {
      icon: Shield,
      label: "Account Security",
      desc: "Change password and enable 2FA",
      href: "/security",
    },
    {
      icon: Palette,
      label: "Theme Customization",
      desc: "Light, Dark, and System modes",
      href: "/theme",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border p-8">

        {/* Back Button */}
        <Link
          href="/chat"
          className="flex items-center gap-2 text-gray-500 hover:text-black mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chat
        </Link>

        <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

        <div className="space-y-5">

          {/* Settings Options */}
          {options.map((opt) => {
            const Icon = opt.icon;

            return (
              <Link
                key={opt.label}
                href={opt.href}
                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition border"
              >
                <div className="flex items-center gap-4">
                  <div className="text-blue-600">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{opt.label}</p>
                    <p className="text-sm text-gray-500">{opt.desc}</p>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: "/auth" })}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-red-50 transition border border-red-100 text-red-600"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Log Out</span>
          </button>

        </div>
      </div>
    </div>
  );
}