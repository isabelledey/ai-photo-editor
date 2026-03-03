"use client"

import { Wand2, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react"

type ResultState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; gender: string }

interface EnhanceButtonProps {
  hasFile: boolean
  result: ResultState
  onEnhance: () => void
  onDismissResult: () => void
}

export function EnhanceButton({ hasFile, result, onEnhance, onDismissResult }: EnhanceButtonProps) {
  const isLoading = result.status === "loading"
  const handleEnhanceClick = () => {
    console.log("[Upload][EnhanceButton] enhance clicked", {
      hasFile,
      status: result.status,
    })
    onEnhance()
  }
  const handleDismissClick = () => {
    console.log("[Upload][EnhanceButton] dismiss result clicked", {
      status: result.status,
    })
    onDismissResult()
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Main action button */}
        <button
          type="button"
          onClick={handleEnhanceClick}
          disabled={!hasFile || isLoading}
        className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#D4467E] to-[#5B3FBF] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#D4467E]/20 transition-all enabled:hover:shadow-xl enabled:hover:shadow-[#D4467E]/30 enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {/* Animated shimmer on hover */}
        <span className="pointer-events-none absolute inset-0 translate-x-[-200%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-[200%]" />

        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Analyzing Image...
          </>
        ) : (
          <>
            <Wand2 className="h-5 w-5" />
            Enhance Face
          </>
        )}
      </button>

      {/* Result feedback */}
      {result.status === "error" && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 backdrop-blur-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-300">Detection Failed</p>
            <p className="mt-1 text-sm leading-relaxed text-red-300/80">{result.message}</p>
          </div>
          <button
            type="button"
            onClick={handleDismissClick}
            className="shrink-0 rounded-lg p-1 text-red-400/60 transition-colors hover:bg-red-500/10 hover:text-red-300"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {result.status === "success" && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 backdrop-blur-sm">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-300">Person Detected</p>
            <p className="mt-1 text-sm leading-relaxed text-emerald-300/80">
              Gender detection result:{" "}
              <span className="font-bold text-emerald-200">{result.gender}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismissClick}
            className="shrink-0 rounded-lg p-1 text-emerald-400/60 transition-colors hover:bg-emerald-500/10 hover:text-emerald-300"
            aria-label="Dismiss result"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
