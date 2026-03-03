import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  const heroImageSrc = `${import.meta.env.BASE_URL}images/hero-model.jpg`;

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#170C59] pt-28 pb-20">
      {/* Ambient glow effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#5B3FBF]/20 blur-[150px]" />
        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-[#D4467E]/10 blur-[120px]" />
        <div className="absolute top-0 left-0 h-[300px] w-[300px] rounded-full bg-[#5B3FBF]/15 blur-[100px]" />
      </div>

      {/* Decorative circles */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[700px] w-[700px] rounded-full border border-[rgba(91,63,191,0.15)]" />
      </div>
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[900px] w-[900px] rounded-full border border-[rgba(91,63,191,0.08)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="grid min-h-[75vh] items-center gap-12 lg:grid-cols-2 lg:gap-0">
          {/* Left text column */}
          <div className="relative z-20 flex flex-col gap-8">
            {/* Badge */}
            <div className="flex">
              <div className="flex items-center gap-2 rounded-full border border-[rgba(91,63,191,0.3)] bg-[rgba(91,63,191,0.15)] px-4 py-2 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-[#D4467E]" />
                <span className="text-sm font-medium text-[#A994E0]">
                  AI-Powered Fashion Analysis
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="font-[family-name:var(--font-playfair)] text-5xl leading-[1.1] font-bold tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl">
              <span className="text-balance">Your Style,</span>
              <br />
              <span className="bg-gradient-to-r from-[#D4467E] to-[#5B3FBF] bg-clip-text text-transparent">
                Reimagined
              </span>
            </h1>

            {/* Subtext */}
            <p className="max-w-md text-lg leading-relaxed text-[#A994E0]">
              Upload a photo, get instant visual analysis, and explore a
              polished style-enhancement workflow built for speed and clarity.
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                to="/upload"
                className="group flex items-center justify-center gap-2 rounded-2xl bg-[#D4467E] px-8 py-4 text-base font-semibold text-white transition-all hover:bg-[#E05A92] hover:shadow-xl hover:shadow-[#D4467E]/30"
              >
                Start Now
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#"
                className="flex items-center justify-center gap-2 rounded-2xl border border-[rgba(91,63,191,0.3)] bg-[rgba(91,63,191,0.1)] px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-[rgba(91,63,191,0.5)] hover:bg-[rgba(91,63,191,0.2)]"
              >
                See How It Works
              </a>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#170C59] bg-gradient-to-br from-[#5B3FBF] to-[#D4467E] text-xs font-bold text-white"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  12,000+ Users
                </p>
                <p className="text-xs text-[#A994E0]">
                  Already transforming their style
                </p>
              </div>
            </div>
          </div>

          {/* Right image column — large, overlapping */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="relative h-[500px] w-[420px] sm:h-[600px] sm:w-[500px] lg:absolute lg:-right-16 lg:h-[700px] lg:w-[600px] xl:-right-24 xl:h-[780px] xl:w-[680px]">
              {/* Glow behind image */}
              <div className="absolute inset-0 rounded-full bg-[#5B3FBF]/20 blur-[80px]" />
              <img
                src={heroImageSrc}
                alt="Fashion model with an elaborate floral headpiece featuring roses and lilies, styled with dramatic purple and pink lighting"
                className="h-full w-full rounded-3xl object-cover object-top"
                loading="eager"
              />
              {/* Overlay gradient to blend into background */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-l from-transparent via-transparent to-[#170C59]/60" />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-[#170C59] via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
