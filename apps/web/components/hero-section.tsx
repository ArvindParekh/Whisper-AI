"use client"

import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, Code, Zap, Users, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

const floatingVariants = {
  animate: {
    y: [-10, 10, -10],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 6,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
}

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const codeRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(codeRef, { once: true, margin: "-100px" })
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />

      {/* Hero Content */}
      <motion.div style={{ y, opacity }} className="flex-1 flex items-center justify-center px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center"
        >
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <motion.div variants={itemVariants}>
                <Badge variant="secondary" className="w-fit">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <Zap className="w-3 h-3 mr-1" />
                  </motion.div>
                  AI-Powered Pair Programming
                </Badge>
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-5xl lg:text-6xl font-bold leading-tight text-balance">
                Your AI Pair Programmer is{" "}
                <motion.span
                  className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                  style={{
                    backgroundSize: "200% 200%",
                  }}
                >
                  Just a Call Away
                </motion.span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-xl text-muted-foreground leading-relaxed text-pretty">
                Get live, voice-first coding assistance with full context of your codebase. Think pair programming with
                Claude, but over voice chat.
              </motion.p>
            </div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(139, 92, 246, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/session">
                  <Button size="lg" className="group">
                    <Mic className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                    Start Session
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="lg" className="group bg-transparent">
                  <Code className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  View Demo
                </Button>
              </motion.div>
            </motion.div>

            {/* Features List */}
            <motion.div variants={itemVariants} className="grid sm:grid-cols-2 gap-4 pt-8">
              {[
                { icon: Code, text: "Full codebase context" },
                { icon: Mic, text: "Voice-first interface" },
                { icon: Zap, text: "Real-time sync" },
                { icon: Users, text: "Live collaboration" },
              ].map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                  whileHover={{ x: 5, transition: { duration: 0.2 } }}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                    className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"
                  >
                    <feature.icon className="w-4 h-4 text-primary" />
                  </motion.div>
                  <span className="text-sm text-muted-foreground">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Column - Animated Code Background */}
          <motion.div ref={codeRef} variants={floatingVariants} animate="animate" className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
              animate={isInView ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="glass rounded-2xl p-8 overflow-hidden relative"
              style={{
                background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="space-y-2 font-mono text-sm"
              >
                <motion.div
                  animate={{
                    y: [0, -200],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                  className="space-y-2"
                >
                  {/* Code lines with syntax highlighting */}
                  {[
                    { text: "const whisper = new WhisperClient()", color: "text-accent" },
                    { text: "await whisper.connect()", color: "text-primary" },
                    { text: "whisper.onVoiceInput(async (input) => {", color: "text-muted-foreground" },
                    { text: "  const response = await ai.generateCode(input)", color: "text-accent" },
                    { text: "  return response.withContext(codebase)", color: "text-primary" },
                    { text: "})", color: "text-muted-foreground" },
                    { text: '// AI: "I can see your React components..."', color: "text-green-400" },
                    { text: '// AI: "Let me help you refactor this..."', color: "text-green-400" },
                    { text: "function optimizeComponent() {", color: "text-accent" },
                    { text: "  return useMemo(() => {", color: "text-primary" },
                    { text: "    // Optimized implementation", color: "text-green-400" },
                    { text: "  }, [dependencies])", color: "text-muted-foreground" },
                    { text: "}", color: "text-muted-foreground" },
                  ].map((line, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                      className={line.color}
                    >
                      {line.text}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Floating Elements */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
                className="absolute top-4 right-4 w-3 h-3 rounded-full bg-primary"
              />
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute bottom-8 left-4 w-2 h-2 rounded-full bg-accent"
              />
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.9, 0.4],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute top-1/2 right-8 w-1 h-1 rounded-full bg-primary"
              />
            </motion.div>

            {/* Status Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1, duration: 0.6 }}
              className="absolute -bottom-4 left-8 right-8 flex justify-center"
            >
              <motion.div whileHover={{ scale: 1.05 }} className="glass rounded-full px-4 py-2 flex items-center gap-2">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="w-2 h-2 rounded-full bg-green-400"
                />
                <span className="text-xs text-muted-foreground">AI Ready</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="border-t border-border/50 px-6 py-8"
      >
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <p className="text-sm text-muted-foreground">Trusted by developers at top companies worldwide</p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="flex items-center justify-center gap-8"
          >
            {["Vercel", "GitHub", "OpenAI", "Anthropic"].map((company, index) => (
              <motion.div
                key={company}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.5, y: 0 }}
                transition={{ delay: 1.7 + index * 0.1, duration: 0.4 }}
                whileHover={{ opacity: 1, y: -2 }}
                className="text-lg font-semibold cursor-pointer"
              >
                {company}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
