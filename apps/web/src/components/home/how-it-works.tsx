"use client";

import { Terminal, Mic, MessageSquare } from "lucide-react";

export function HowItWorks() {
  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="container mx-auto max-w-4xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Not autocomplete. A{" "}
            <span className="text-orange-500">thinking partner</span>.
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Voice-first means you stay in flow while discussing architecture,
            not just writing code.
          </p>
        </div>

        {/* Simple 3-Step */}
        <div className="space-y-12">
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-orange-600/10 border border-orange-500/20 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                1. Connect your project
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Run{" "}
                <code className="px-2 py-1 bg-white/5 rounded text-sm text-orange-300">
                  npx whisper-ai
                </code>{" "}
                in your terminal. That's it. No config, no API keys to manage.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-orange-600/10 border border-orange-500/20 flex items-center justify-center">
              <Mic className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                2. Talk through your ideas
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Discuss architecture decisions, debug issues verbally, think out
                loud. The AI understands your entire codebase context.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-orange-600/10 border border-orange-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                3. Get strategic guidance
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Receive suggestions based on your project structure,
                dependencies, and patterns. Make better decisions, not just
                faster code.
              </p>
            </div>
          </div>
        </div>

        {/* Example conversation */}
        <div className="mt-16 p-6 rounded-lg bg-white/[0.02] border border-white/10">
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-gray-500">You:</span>{" "}
              <span className="text-gray-300">
                "Should I use dependency injection here or keep it simple?"
              </span>
            </div>
            <div>
              <span className="text-orange-400">AI:</span>{" "}
              <span className="text-gray-300">
                "Looking at your auth service, I see it's already using DI in
                the database layer. For consistency and testability, I'd
                recommend it here too. Let me show you a pattern..."
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
