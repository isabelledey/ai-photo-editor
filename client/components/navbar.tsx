"use client"

import { Link } from "react-router-dom"
import { useState } from "react"
import { Menu, X, Sparkles } from "lucide-react"

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between rounded-2xl border border-[rgba(91,63,191,0.2)] bg-[rgba(23,12,89,0.6)] px-6 py-3 backdrop-blur-xl">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5B3FBF]">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-[family-name:var(--font-playfair)] text-xl font-bold tracking-tight text-white">
              AI Stylist
            </span>
          </a>

          {/* Desktop Links */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-[#A994E0] transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden items-center gap-4 md:flex">
            <a
              href="#"
              className="text-sm font-medium text-[#A994E0] transition-colors hover:text-white"
            >
              Sign In
            </a>
            <Link
              to="/upload"
              className="rounded-xl bg-[#D4467E] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#E05A92] hover:shadow-lg hover:shadow-[#D4467E]/25"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="mt-2 rounded-2xl border border-[rgba(91,63,191,0.2)] bg-[rgba(23,12,89,0.95)] px-6 py-6 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-base font-medium text-[#A994E0] transition-colors hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <hr className="border-[rgba(91,63,191,0.2)]" />
              <a href="#" className="text-base font-medium text-[#A994E0]">Sign In</a>
              <Link
                to="/upload"
                className="rounded-xl bg-[#D4467E] px-5 py-3 text-center text-base font-semibold text-white"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
