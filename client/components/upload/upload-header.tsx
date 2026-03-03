import { Link } from "react-router-dom"
import { ArrowLeft, Sparkles } from "lucide-react"

interface UploadHeaderProps {
  isAdmin: boolean
  onToggleAdmin: (next: boolean) => void
}

export function UploadHeader({ isAdmin, onToggleAdmin }: UploadHeaderProps) {
  return (
    <header className="relative z-10 mx-auto flex max-w-4xl items-center justify-between px-6 pt-8 pb-4">
      <Link
        to="/"
        className="group flex items-center gap-2 rounded-xl border border-[rgba(91,63,191,0.2)] bg-[rgba(91,63,191,0.1)] px-4 py-2.5 text-sm font-medium text-[#A994E0] backdrop-blur-sm transition-all hover:border-[rgba(91,63,191,0.4)] hover:bg-[rgba(91,63,191,0.2)] hover:text-white"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back
      </Link>
      <Link to="/" className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5B3FBF]">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <span className="font-[family-name:var(--font-playfair)] text-xl font-bold tracking-tight text-white">
          AI Stylist
        </span>
      </Link>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[rgba(91,63,191,0.2)] bg-[rgba(91,63,191,0.1)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#A994E0]">
        <span>Admin Mode</span>
        <span
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            isAdmin ? "bg-[#5B3FBF]" : "bg-[rgba(169,148,224,0.35)]"
          }`}
        >
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(event) => onToggleAdmin(event.target.checked)}
            className="peer sr-only"
            aria-label="Toggle admin mode"
          />
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
              isAdmin ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </span>
      </label>
    </header>
  )
}
