"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Github } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center space-y-6">
          {/* Badge */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-600/10 border border-orange-500/20 text-sm text-orange-300">
              <Github className="w-3.5 h-3.5" />
              <span>Built at Northeastern • Open Source</span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-tight animate-slide-up delay-100">
            Think <span className="text-orange-500">with</span> AI,
            <br />
            not just code.
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed animate-slide-up delay-200">
            Voice-first pair programming. Discuss architecture, debug verbally, stay in flow.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 animate-slide-up delay-300">
            <Link href="/dashboard">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white h-12 px-6 font-medium shadow-lg shadow-orange-900/20"
              >
                Start Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-12 px-6 border-white/10 hover:border-white/20 hover:bg-white/5"
            >
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Terminal Preview */}
        <div className="mt-16 max-w-3xl mx-auto animate-slide-up delay-300">
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dot bg-red-500" />
              <div className="terminal-dot bg-yellow-500" />
              <div className="terminal-dot bg-green-500" />
              <span className="ml-2 text-xs text-gray-500">terminal</span>
            </div>
            <div className="p-6 font-mono text-sm space-y-3">
              <div>
                <span className="text-orange-400">$</span>{" "}
                <span className="text-gray-300">npx whisper-ai</span>
              </div>
              <div className="text-gray-500">→ Analyzing project structure...</div>
              <div className="text-green-400">✓ Connected to your codebase</div>
              <div className="text-orange-400">✓ Voice session ready</div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="text-gray-500">You:</span>{" "}
                <span className="text-white">"Let's refactor the auth service"</span>
              </div>
              <div>
                <span className="text-orange-400">AI:</span>{" "}
                <span className="text-gray-300">"I see you're using password hashing...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

