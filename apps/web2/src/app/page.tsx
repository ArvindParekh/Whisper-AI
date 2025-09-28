import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Mic, Zap, Settings } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text text-balance animate-fade-in">
            Pair programming at the speed of thought
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto animate-slide-up">
            Voice-first AI that understands your entire codebase
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-scale-in">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-100 btn-glow interactive-scale animate-glow"
            >
              Start Free
            </Button>
            <Button variant="outline" size="lg" className="glass-card group interactive-scale bg-transparent">
              <Play className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
              View Demo
            </Button>
          </div>

          {/* Animated Code Editor Mockup */}
          <div className="glass-card p-8 rounded-2xl max-w-3xl mx-auto animate-float">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-muted-foreground ml-4">main.tsx</span>
            </div>
            <div className="text-left font-mono text-sm space-y-2">
              <div className="text-muted-foreground">// Voice: "Create a user authentication function"</div>
              <div className="text-blue-400">
                function <span className="text-yellow-400">authenticateUser</span>(
                <span className="text-orange-400">credentials</span>) {"{"}
              </div>
              <div className="pl-4 text-green-400">
                return <span className="text-blue-400">await</span>{" "}
                <span className="text-yellow-400">verifyCredentials</span>(
                <span className="text-orange-400">credentials</span>)
              </div>
              <div>{"}"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="glass-card p-8 text-center group hover:scale-105 transition-all duration-200 gradient-border interactive-scale">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Context Aware</h3>
              <p className="text-muted-foreground">
                Understands your entire codebase, dependencies, and project structure for intelligent suggestions.
              </p>
            </Card>

            <Card className="glass-card p-8 text-center group hover:scale-105 transition-all duration-200 gradient-border interactive-scale">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mic className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Voice Native</h3>
              <p className="text-muted-foreground">
                Natural voice commands that translate directly into code. No typing required.
              </p>
            </Card>

            <Card className="glass-card p-8 text-center group hover:scale-105 transition-all duration-200 gradient-border interactive-scale">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Settings className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Zero Setup</h3>
              <p className="text-muted-foreground">
                Works with any project. Just run one command and start coding with your voice.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-6 border-t border-border/50">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground mb-8">Used by developers at</p>
          <div className="flex flex-wrap justify-center items-center gap-8 mb-12 opacity-50">
            <div className="text-2xl font-bold">Vercel</div>
            <div className="text-2xl font-bold">Linear</div>
            <div className="text-2xl font-bold">Cursor</div>
            <div className="text-2xl font-bold">Raycast</div>
            <div className="text-2xl font-bold">Supabase</div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">10,000+</div>
              <div className="text-muted-foreground">sessions</div>
            </div>
            <div className="hidden sm:block w-px bg-border"></div>
            <div>
              <div className="text-3xl font-bold text-primary">1M+</div>
              <div className="text-muted-foreground">lines analyzed</div>
            </div>
            <div className="hidden sm:block w-px bg-border"></div>
            <div>
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-muted-foreground">uptime</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
