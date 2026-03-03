"use client"

import { Crown, Sparkles, X } from "lucide-react"

type ThemeKey = "basic" | "festival" | "fantasy" | "corporate"

interface ThemeOption {
  key: ThemeKey
  title: string
  subtitle: string
  premium: boolean
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    key: "basic",
    title: "Basic",
    subtitle: "Free - standard CodeFormer restoration",
    premium: false,
  },
  {
    key: "festival",
    title: "Festival",
    subtitle: "Premium - colorful festival glitter, vibrant lighting",
    premium: true,
  },
  {
    key: "fantasy",
    title: "Fantasy",
    subtitle: "Premium - ethereal glow, cinematic fantasy lighting",
    premium: true,
  },
  {
    key: "corporate",
    title: "Corporate",
    subtitle: "Premium - professional studio headshot, sharp focus",
    premium: true,
  },
]

interface ThemeModalProps {
  open: boolean
  loading: boolean
  onClose: () => void
  onSelect: (theme: ThemeKey) => void
}

export function ThemeModal({ open, loading, onClose, onSelect }: ThemeModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-[rgba(91,63,191,0.25)] bg-[#120a45] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-white">Select Enhancement Theme</h3>
            <p className="mt-1 text-sm text-[#A994E0]">
              Choose a theme before running face enhancement.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-[#A994E0] transition-colors hover:bg-[rgba(91,63,191,0.2)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close theme modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => onSelect(option.key)}
              disabled={loading}
              className="group rounded-xl border border-[rgba(91,63,191,0.25)] bg-[rgba(91,63,191,0.08)] p-4 text-left transition-all hover:border-[rgba(212,70,126,0.5)] hover:bg-[rgba(212,70,126,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-white">{option.title}</span>
                {option.premium ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(212,70,126,0.2)] px-2 py-0.5 text-[11px] font-semibold text-[#f7b5d0]">
                    <Crown className="h-3 w-3" />
                    Premium
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(91,63,191,0.25)] px-2 py-0.5 text-[11px] font-semibold text-[#A994E0]">
                    <Sparkles className="h-3 w-3" />
                    Free
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#A994E0]">{option.subtitle}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
