import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out AI Stylist with basic features.",
    features: [
      "3 photo analyses per month",
      "Basic color matching",
      "Standard AI suggestions",
      "Community access",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "Full access to all AI styling tools and premium features.",
    features: [
      "Unlimited photo analyses",
      "Advanced color science",
      "Premium AI styling engine",
      "Trend forecasting",
      "Shopping recommendations",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$49",
    period: "per month",
    description: "For agencies and brands that need AI styling at scale.",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "API access",
      "Custom brand guidelines",
      "Dedicated account manager",
      "White-label options",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="relative bg-[#170C59] py-28">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5B3FBF]/8 blur-[180px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div className="mx-auto mb-20 max-w-2xl text-center">
          <p className="mb-4 text-sm font-semibold tracking-widest uppercase text-[#D4467E]">
            Pricing
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight text-white sm:text-5xl text-balance">
            Invest in Your
            <br />
            <span className="bg-gradient-to-r from-[#D4467E] to-[#5B3FBF] bg-clip-text text-transparent">
              Personal Style
            </span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[#A994E0]">
            Choose the plan that fits your journey. Cancel anytime.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 backdrop-blur-xl transition-all duration-300 ${
                plan.popular
                  ? "border-[#D4467E]/40 bg-[rgba(212,70,126,0.08)] shadow-2xl shadow-[#D4467E]/10"
                  : "border-[rgba(91,63,191,0.2)] bg-[rgba(91,63,191,0.08)] hover:border-[rgba(91,63,191,0.4)]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#D4467E] px-4 py-1 text-xs font-bold tracking-wide text-white uppercase">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="mb-2 text-lg font-semibold text-[#A994E0]">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="font-[family-name:var(--font-playfair)] text-5xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-sm text-[#A994E0]">/{plan.period}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#A994E0]">
                  {plan.description}
                </p>
              </div>

              <ul className="mb-8 flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm text-[#F0EBF9]"
                  >
                    <Check className="h-4 w-4 shrink-0 text-[#D4467E]" />
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.cta === "Contact Sales" ? (
                <a
                  href="mailto:sales@aistylist.com"
                  className={`block w-full rounded-xl py-3.5 text-center text-sm font-semibold transition-all ${
                    plan.popular
                      ? "bg-[#D4467E] text-white hover:bg-[#E05A92] hover:shadow-lg hover:shadow-[#D4467E]/25"
                      : "border border-[rgba(91,63,191,0.3)] bg-[rgba(91,63,191,0.15)] text-white hover:bg-[rgba(91,63,191,0.25)]"
                  }`}
                >
                  {plan.cta}
                </a>
              ) : (
                <Link
                  to="/upload"
                  className={`block w-full rounded-xl py-3.5 text-center text-sm font-semibold transition-all ${
                    plan.popular
                      ? "bg-[#D4467E] text-white hover:bg-[#E05A92] hover:shadow-lg hover:shadow-[#D4467E]/25"
                      : "border border-[rgba(91,63,191,0.3)] bg-[rgba(91,63,191,0.15)] text-white hover:bg-[rgba(91,63,191,0.25)]"
                  }`}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
