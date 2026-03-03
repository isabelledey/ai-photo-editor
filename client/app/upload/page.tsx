"use client"

import { UploadHeader } from "@/components/upload/upload-header"
import { FaceWorkflow } from "@/components/upload/face-workflow"
import { Sparkles } from "lucide-react"

export default function UploadPage() {
  return (
    <div className="relative min-h-screen bg-[#170C59]">
      {/* Ambient glow effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#5B3FBF]/15 blur-[160px]" />
        <div className="absolute right-0 bottom-1/3 h-[300px] w-[300px] rounded-full bg-[#D4467E]/8 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-[#5B3FBF]/10 blur-[100px]" />
      </div>

      {/* Decorative orbital ring */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[800px] w-[800px] rounded-full border border-[rgba(91,63,191,0.08)]" />
      </div>

      <UploadHeader />

      <main className="relative z-10 mx-auto max-w-xl px-6 pt-8 pb-24">
        {/* Page title */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-[#D4467E]" />
            <span className="text-sm font-semibold tracking-widest uppercase text-[#D4467E]">
              Upload & Analyze
            </span>
            <Sparkles className="h-5 w-5 text-[#D4467E]" />
          </div>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight text-white sm:text-4xl text-balance">
            Enhance Your Look
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[#A994E0]">
            Upload a photo to analyze and enhance facial features with AI
          </p>
        </div>

        {/* Glass card container */}
        <FaceWorkflow />

        {/* Subtle tip */}
        <p className="mt-6 text-center text-xs text-[#A994E0]/50">
          Your images are processed securely and never stored on our servers.
        </p>
      </main>
    </div>
  )
}
