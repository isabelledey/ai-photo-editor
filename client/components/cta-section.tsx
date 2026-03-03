import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

export function CTASection() {
  return (
    <section className="relative bg-[#170C59] py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4467E]/10 blur-[150px]" />
        <div className="absolute top-0 right-0 h-[300px] w-[300px] rounded-full bg-[#5B3FBF]/15 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        {/* Glassmorphism card */}
        <div className="rounded-3xl border border-[rgba(91,63,191,0.25)] bg-[rgba(91,63,191,0.08)] p-12 backdrop-blur-xl sm:p-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(212,70,126,0.3)] bg-[rgba(212,70,126,0.1)] px-4 py-2">
            <Sparkles className="h-4 w-4 text-[#D4467E]" />
            <span className="text-sm font-medium text-[#D4467E]">
              Start Your Transformation
            </span>
          </div>

          <h2 className="mx-auto max-w-2xl font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight text-white sm:text-5xl text-balance">
            Ready to Elevate Your Personal Style?
          </h2>

          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-[#A994E0]">
            Join thousands of users who are already using AI Stylist to unlock their best look, every day.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/upload"
              className="group flex items-center gap-2 rounded-2xl bg-[#D4467E] px-10 py-4 text-base font-semibold text-white transition-all hover:bg-[#E05A92] hover:shadow-xl hover:shadow-[#D4467E]/30"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/#pricing"
              className="rounded-2xl border border-[rgba(91,63,191,0.3)] bg-[rgba(91,63,191,0.1)] px-10 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-[rgba(91,63,191,0.5)] hover:bg-[rgba(91,63,191,0.2)]"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
