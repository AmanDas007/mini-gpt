import { Check } from "lucide-react";
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
    ],
    button: "Start Free",
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
    ],
    button: "Upgrade to Pro",
    popular: true,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-gray-600 mb-12">
          Simple pricing. No hidden fees.
        </p>

        <div className="grid md:grid-cols-2 gap-10">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-xl p-10 border ${
                plan.popular
                  ? "border-blue-600 scale-105"
                  : "border-gray-200"
              } transition`}
            >
              {plan.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              )}

              <h3 className="text-2xl font-bold mb-2">
                {plan.name} Plan
              </h3>

              <p className="text-gray-500 mb-6">
                {plan.description}
              </p>

              <div className="text-5xl font-bold mb-6">
                ${plan.price}
                <span className="text-lg text-gray-500 font-normal">
                  /month
                </span>
              </div>

              <ul className="space-y-4 mb-8 text-left">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3"
                  >
                    <Check className="text-green-500 w-5 h-5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.price === 0 ? "/chat" : "/checkout"}
                className={`block text-center py-3 rounded-xl font-semibold transition ${
                  plan.popular
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {plan.button}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}