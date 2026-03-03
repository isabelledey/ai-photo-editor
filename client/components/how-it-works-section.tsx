import { Upload, Cpu, Shirt } from "lucide-react"

const steps = [
  {
    step: "01",
    icon: Upload,
    title: "Upload Your Photo",
    description: "Snap a picture or upload an existing outfit photo. Our AI works with any lighting or angle.",
  },
  {
    step: "02",
    icon: Cpu,
    title: "AI Analyzes Your Style",
    description: "In seconds, our engine breaks down color harmony, silhouette, proportions, and trend alignment.",
  },
  {
    step: "03",
    icon: Shirt,
    title: "Get Your Styled Look",
    description: "Receive a complete style enhancement plan with specific suggestions, product picks, and styling tips.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative bg-[#120A45] py-28">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-[#D4467E]/5 blur-[150px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Section header */}
        <div className="mx-auto mb-20 max-w-2xl text-center">
          <p className="mb-4 text-sm font-semibold tracking-widest uppercase text-[#D4467E]">
            How It Works
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight text-white sm:text-5xl text-balance">
            Three Simple Steps to
            <br />
            <span className="bg-gradient-to-r from-[#D4467E] to-[#5B3FBF] bg-clip-text text-transparent">
              Your Best Look
            </span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid gap-8 lg:grid-cols-3">
          {steps.map((item, index) => (
            <div key={item.step} className="relative flex flex-col items-center text-center">
              {/* Connector line (desktop) */}
              {index < steps.length - 1 && (
                <div className="pointer-events-none absolute top-12 left-[calc(50%+80px)] hidden h-px w-[calc(100%-160px)] bg-gradient-to-r from-[#5B3FBF]/40 to-[#D4467E]/40 lg:block" />
              )}

              {/* Step number ring */}
              <div className="relative mb-8">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[rgba(91,63,191,0.3)] bg-[rgba(91,63,191,0.1)] backdrop-blur-xl">
                  <item.icon className="h-10 w-10 text-[#D4467E]" />
                </div>
                <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#D4467E] text-xs font-bold text-white">
                  {item.step}
                </div>
              </div>

              <h3 className="mb-3 text-2xl font-bold text-white">{item.title}</h3>
              <p className="max-w-xs leading-relaxed text-[#A994E0]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
