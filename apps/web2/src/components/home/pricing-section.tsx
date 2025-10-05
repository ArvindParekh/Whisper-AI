"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Free",
    price: "$0",
    features: [
      "5 hours/month voice sessions",
      "Basic code context",
      "Community support"
    ],
    cta: "Start Free",
    href: "/dashboard"
  },
  {
    name: "Pro",
    price: "$25",
    period: "/mo",
    features: [
      "Unlimited voice sessions",
      "Deep codebase analysis",
      "Priority support",
      "Session history"
    ],
    cta: "Go Pro",
    href: "/dashboard",
    popular: true
  },
  {
    name: "Team",
    price: "$100",
    period: "/mo",
    features: [
      "Everything in Pro",
      "Up to 5 team members",
      "Shared sessions",
      "Team analytics"
    ],
    cta: "Contact Sales",
    href: "/dashboard"
  }
]

export function PricingSection() {
  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="container mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple pricing
          </h2>
          <p className="text-lg text-gray-400">
            Start free. Upgrade when you need more. Cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`card-subtle p-6 rounded-lg ${
                plan.popular ? 'ring-1 ring-orange-500/50' : ''
              }`}
            >
              {plan.popular && (
                <div className="mb-4">
                  <span className="text-xs font-medium text-orange-400 bg-orange-600/10 px-2 py-1 rounded">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-gray-500 ml-1">{plan.period}</span>}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href}>
                <Button
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg shadow-orange-900/20'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

