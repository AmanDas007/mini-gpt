"use client";

import { Check, Sparkles } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: 0,
    description: "Perfect for getting started",
    features: [
      "100 messages per day",
      "Standard response speed",
      "Community support",
      "Text-only generation",
    ],
    button: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: 20,
    description: "For power users & developers",
    features: [
      "Unlimited messages",
      "Priority GPT-4 access",
      "Faster response speed",
      "Early access to new features",
      "Image & Video generation",
    ],
    button: "Upgrade to Pro",
    popular: true,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-gray-100 py-20 px-4">
      <div className="max-w-5xl mx-auto text-center">
        {/* Header Section */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-gray-400 text-lg">
            Simple pricing. No hidden fees. Select the power you need.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col bg-[#161b22] rounded-2xl p-8 border transition-all duration-300 ${
                plan.popular
                  ? "border-blue-500 shadow-[0_0_40px_-15px_rgba(59,130,246,0.3)] scale-105 z-10"
                  : "border-gray-800 hover:border-gray-700"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 uppercase tracking-wider">
                  <Sparkles size={14} /> Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2 text-white">
                  {plan.name}
                </h3>
                <p className="text-gray-400 text-sm">
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-extrabold text-white">${plan.price}</span>
                  <span className="text-gray-500 text-lg">/month</span>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-10 flex-1 text-left">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-gray-300">
                    <div className="mt-1 bg-green-500/10 p-0.5 rounded-full">
                      <Check className="text-green-500 w-4 h-4" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              <Link
                href={plan.price === 0 ? "/chat" : "/checkout"}
                className={`w-full block text-center py-4 rounded-xl font-bold transition-all duration-200 ${
                  plan.popular
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20"
                    : "bg-[#0d1117] text-gray-300 border border-gray-700 hover:bg-[#1c2128] hover:text-white"
                }`}
              >
                {plan.button}
              </Link>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <p className="mt-12 text-gray-500 text-sm italic">
          Prices are in USD. Secure payment processing via Stripe.
        </p>
      </div>
    </div>
  );
}