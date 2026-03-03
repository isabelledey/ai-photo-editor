"use client"

import { useState, useCallback, useRef } from "react"
import { UploadHeader } from "@/components/upload/upload-header"
import { ImageUploader } from "@/components/upload/image-uploader"
import { EnhanceButton } from "@/components/upload/enhance-button"
import { Sparkles } from "lucide-react"

type ResultState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; gender: string }

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<ResultState>({ status: "idle" })
  const analysisRunRef = useRef(0)
  const logEvent = (event: string, details?: Record<string, unknown>) => {
    console.log(`[UploadPage] ${event}`, {
      timestamp: new Date().toISOString(),
      ...details,
    })
  }

  const handleFileSelect = useCallback((f: File, url: string) => {
    // Invalidate any in-flight analysis from a previous file.
    analysisRunRef.current += 1
    logEvent("file selected", {
      runToken: analysisRunRef.current,
      name: f.name,
      type: f.type,
      size: f.size,
    })
    setFile(f)
    setPreview(url)
    setResult({ status: "idle" })
  }, [])

  const handleRemove = useCallback(() => {
    // Invalidate any in-flight analysis when file is removed.
    analysisRunRef.current += 1
    logEvent("file removed", {
      runToken: analysisRunRef.current,
      previousFile: file?.name ?? null,
    })
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setResult({ status: "idle" })
  }, [file?.name, preview])

  const handleEnhance = useCallback(async () => {
    if (!file) {
      logEvent("enhance clicked without file")
      return
    }

    const runId = ++analysisRunRef.current
    logEvent("enhance started", {
      runId,
      file: file.name,
      size: file.size,
    })
    setResult({ status: "loading" })

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const payload = await response.json().catch(() => ({}))
      logEvent("upload response received", {
        runId,
        status: response.status,
        ok: response.ok,
        payload,
      })
      if (!response.ok) {
        const detail = payload?.detail || "Upload/analysis failed."
        throw new Error(detail)
      }

      // Guard against stale async results when user picked/removed another file meanwhile.
      if (runId !== analysisRunRef.current) {
        logEvent("stale enhance result discarded", {
          runId,
          latestRunToken: analysisRunRef.current,
        })
        return
      }

      const analysis = payload?.ai_analysis ?? {}
      const personDetected = Boolean(analysis.person_detected)
      const gender = String(analysis.perceived_gender || "Unknown/Not clear")

      if (!personDetected) {
        logEvent("analysis result: no person detected", {
          runId,
          analysis,
        })
        setResult({
          status: "error",
          message:
            "No person could be detected in this image. Please upload a clear photo that includes a person's face.",
        })
        return
      }

      logEvent("analysis success", {
        runId,
        analysis,
      })
      setResult({ status: "success", gender })
    } catch (error) {
      if (runId !== analysisRunRef.current) {
        logEvent("stale error discarded", {
          runId,
          latestRunToken: analysisRunRef.current,
        })
        return
      }
      logEvent("analysis error", {
        runId,
        error: error instanceof Error ? error.message : String(error),
      })
      setResult({
        status: "error",
        message:
          error instanceof Error ? error.message : "Upload/analysis failed.",
      })
    }
  }, [file])

  const handleDismissResult = useCallback(() => {
    logEvent("dismiss result")
    setResult({ status: "idle" })
  }, [])

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
        <div className="rounded-3xl border border-[rgba(91,63,191,0.2)] bg-[rgba(91,63,191,0.06)] p-6 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6">
            <ImageUploader
              file={file}
              preview={preview}
              onFileSelect={handleFileSelect}
              onRemove={handleRemove}
            />
            <EnhanceButton
              hasFile={!!file}
              result={result}
              onEnhance={handleEnhance}
              onDismissResult={handleDismissResult}
            />
          </div>
        </div>

        {/* Subtle tip */}
        <p className="mt-6 text-center text-xs text-[#A994E0]/50">
          Your images are processed securely and never stored on our servers.
        </p>
      </main>
    </div>
  )
}
