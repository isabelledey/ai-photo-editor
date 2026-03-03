"use client"

import { Crown, X } from "lucide-react"

interface PricingModalProps {
  open: boolean
  onClose: () => void
}

export function PricingModal({ open, onClose }: PricingModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-[rgba(91,63,191,0.25)] bg-[#120a45] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-white">Unlock Premium Themes</h3>
            <p className="mt-1 text-sm text-[#A994E0]">
              Festival, Fantasy, and Corporate themes require a paid plan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#A994E0] transition-colors hover:bg-[rgba(91,63,191,0.2)] hover:text-white"
            aria-label="Close pricing modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-[rgba(91,63,191,0.35)] bg-[rgba(91,63,191,0.1)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A994E0]">Pro</p>
            <p className="mt-3 text-3xl font-bold text-white">$19/mo</p>
            <ul className="mt-4 space-y-2 text-sm text-[#D8CCFF]">
              <li>Festival and Fantasy themes</li>
              <li>Higher priority GPU queue</li>
              <li>Fast export</li>
            </ul>
            <button
              type="button"
              className="mt-5 w-full rounded-lg bg-[#5B3FBF] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Upgrade to Pro
            </button>
          </article>

          <article className="rounded-xl border border-[rgba(212,70,126,0.45)] bg-[rgba(212,70,126,0.12)] p-5">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f7b5d0]">Enterprise</p>
              <Crown className="h-4 w-4 text-[#f7b5d0]" />
            </div>
            <p className="mt-3 text-3xl font-bold text-white">Custom</p>
            <ul className="mt-4 space-y-2 text-sm text-[#ffd8e8]">
              <li>All premium themes + Corporate</li>
              <li>Dedicated support</li>
              <li>Team and API access</li>
            </ul>
            <button
              type="button"
              className="mt-5 w-full rounded-lg border border-[rgba(212,70,126,0.5)] bg-[rgba(212,70,126,0.2)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[rgba(212,70,126,0.3)]"
            >
              Contact Sales
            </button>
          </article>
        </div>
      </div>
    </div>
  )
}
