import { Link } from "react-router-dom"
import { ArrowLeft, Sparkles } from "lucide-react"

export function UploadHeader() {
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
    </header>
  )
}
