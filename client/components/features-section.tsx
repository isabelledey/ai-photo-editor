import { Camera, Palette, Wand2, Sparkles, ShoppingBag, TrendingUp } from "lucide-react"

const features = [
  {
    icon: Camera,
    title: "Instant Photo Analysis",
    description:
      "Upload any outfit photo and get a comprehensive style breakdown in seconds — from color harmony to fit assessment.",
  },
  {
    icon: Palette,
    title: "Color Palette Matching",
    description:
      "Discover your personal color season and get curated palette suggestions that complement your natural features.",
  },
  {
    icon: Wand2,
    title: "AI Style Enhancement",
    description:
      "Receive intelligent outfit modifications and styling tips powered by advanced visual AI to elevate your look.",
  },
  {
    icon: ShoppingBag,
    title: "Smart Shopping Guide",
    description:
      "Get personalized product recommendations from top brands that match your style profile and budget.",
  },
  {
    icon: TrendingUp,
    title: "Trend Forecasting",
    description:
      "Stay ahead with AI-predicted trends tailored to your personal style, curated from global fashion data.",
  },
  {
    icon: Sparkles,
    title: "Wardrobe Optimization",
    description:
      "Maximize your existing wardrobe with intelligent pairing suggestions and identify key pieces to complete your collection.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative bg-[#170C59] py-28">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-0 left-1/3 h-[400px] w-[400px] rounded-full bg-[#5B3FBF]/10 blur-[150px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div className="mx-auto mb-20 max-w-2xl text-center">
          <p className="mb-4 text-sm font-semibold tracking-widest uppercase text-[#D4467E]">
            Features
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight text-white sm:text-5xl text-balance">
            Everything You Need to
            <br />
            <span className="bg-gradient-to-r from-[#D4467E] to-[#5B3FBF] bg-clip-text text-transparent">
              Define Your Style
            </span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[#A994E0]">
            Powerful AI-driven tools designed to transform how you approach personal fashion.
          </p>
        </div>

        {/* Feature cards — glassmorphism */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-[rgba(91,63,191,0.2)] bg-[rgba(91,63,191,0.08)] p-8 backdrop-blur-xl transition-all duration-300 hover:border-[rgba(91,63,191,0.4)] hover:bg-[rgba(91,63,191,0.15)] hover:shadow-2xl hover:shadow-[#5B3FBF]/10"
            >
              {/* Icon */}
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#5B3FBF]/30 to-[#D4467E]/20 ring-1 ring-[rgba(91,63,191,0.3)] transition-all group-hover:from-[#5B3FBF]/40 group-hover:to-[#D4467E]/30">
                <feature.icon className="h-7 w-7 text-[#D4467E]" />
              </div>

              <h3 className="mb-3 text-xl font-bold text-white">
                {feature.title}
              </h3>
              <p className="leading-relaxed text-[#A994E0]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
