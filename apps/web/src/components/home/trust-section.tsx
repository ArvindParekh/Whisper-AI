"use client";

import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function TrustSection() {
  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="container mx-auto max-w-4xl">
        {/* Simple stats */}
        <div className="grid grid-cols-3 gap-8 mb-16 text-center">
          <div>
            <div className="text-3xl font-bold text-white mb-1">10K+</div>
            <div className="text-sm text-gray-500">Sessions</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">100%</div>
            <div className="text-sm text-gray-500">Open Source</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">Private</div>
            <div className="text-sm text-gray-500">Your code</div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center">
          <p className="text-gray-400 mb-6">
            Built at Northeastern University. Open source and privacy-focused.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://github.com/yourusername/whisper-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              View on GitHub
            </a>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 pt-16 border-t border-white/5 text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to think with <span className="text-orange-500">AI</span>?
          </h3>
          <p className="text-gray-400 mb-8">
            Start your first voice session in under a minute.
          </p>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg shadow-orange-900/20"
            >
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
