import { Sparkles } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-[rgba(91,63,191,0.15)] bg-[#120A45] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a href="#" className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5B3FBF]">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-[family-name:var(--font-playfair)] text-xl font-bold text-white">
                AI Stylist
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#A994E0]">
              Your personal AI-powered fashion intelligence, designed to elevate your everyday style.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-wide text-white uppercase">
              Product
            </h4>
            <ul className="flex flex-col gap-3">
              {["Features", "Pricing", "How It Works", "API"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-[#A994E0] transition-colors hover:text-white">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-wide text-white uppercase">
              Company
            </h4>
            <ul className="flex flex-col gap-3">
              {["About", "Blog", "Careers", "Press"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-[#A994E0] transition-colors hover:text-white">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-wide text-white uppercase">
              Legal
            </h4>
            <ul className="flex flex-col gap-3">
              {["Privacy", "Terms", "Cookies", "Licenses"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-[#A994E0] transition-colors hover:text-white">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[rgba(91,63,191,0.15)] pt-8 sm:flex-row">
          <p className="text-sm text-[#A994E0]">
            {'2026 AI Stylist. All rights reserved.'}
          </p>
          <div className="flex gap-6">
            {["Twitter", "Instagram", "LinkedIn"].map((social) => (
              <a key={social} href="#" className="text-sm text-[#A994E0] transition-colors hover:text-white">
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
