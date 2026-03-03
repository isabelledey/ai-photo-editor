"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { CheckCircle2, Crown, Loader2, ScanFace, Wand2 } from "lucide-react"
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision"

import { ImageUploader } from "@/components/upload/image-uploader"
import { PricingModal } from "@/components/upload/pricing-modal"
import { ThemeModal } from "@/components/upload/theme-modal"

type WorkflowState = "UPLOAD" | "DETECTED" | "ENHANCED"
type ThemeKey = "basic" | "festival" | "fantasy" | "corporate"

const LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
const MEDIAPIPE_WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
const PREMIUM_THEMES: ThemeKey[] = ["festival", "fantasy", "corporate"]

interface FaceWorkflowProps {
  isAdmin: boolean
}

export function FaceWorkflow({ isAdmin }: FaceWorkflowProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [workflowState, setWorkflowState] = useState<WorkflowState>("UPLOAD")
  const [faceDetected, setFaceDetected] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [themeModalOpen, setThemeModalOpen] = useState(false)
  const [pricingModalOpen, setPricingModalOpen] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey | null>(null)
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null)
  const [processingStep, setProcessingStep] = useState<string>("")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [promptStrength, setPromptStrength] = useState(0.45)
  const [error, setError] = useState<string | null>(null)

  const landmarkerRef = useRef<FaceLandmarker | null>(null)

  const log = (event: string, details?: Record<string, unknown>) => {
    console.log(`[FaceWorkflow] ${event}`, {
      timestamp: new Date().toISOString(),
      isAdmin,
      ...details,
    })
  }

  const resetWorkflowForNewFile = useCallback(() => {
    setWorkflowState("UPLOAD")
    setFaceDetected(false)
    setEnhancedImageUrl(null)
    setSelectedTheme(null)
    setProcessingStep("")
    setProcessingProgress(0)
    setError(null)
  }, [])

  const handleFileSelect = useCallback(
    (selectedFile: File, objectUrl: string) => {
      log("file selected", {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
      })
      setFile(selectedFile)
      setPreview(objectUrl)
      resetWorkflowForNewFile()
    },
    [resetWorkflowForNewFile]
  )

  const handleRemove = useCallback(() => {
    log("file removed", {
      previousFile: file?.name ?? null,
    })
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setFile(null)
    setPreview(null)
    resetWorkflowForNewFile()
  }, [file?.name, preview, resetWorkflowForNewFile])

  const getFaceLandmarker = useCallback(async () => {
    if (landmarkerRef.current) {
      return landmarkerRef.current
    }

    log("initializing mediapipe face landmarker")
    const filesetResolver = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_BASE)
    landmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: LANDMARKER_MODEL_URL,
      },
      runningMode: "IMAGE",
      numFaces: 1,
    })

    return landmarkerRef.current
  }, [isAdmin])

  const detectFace = useCallback(async () => {
    if (!preview) {
      setError("Please upload an image first.")
      return
    }

    setIsDetecting(true)
    setError(null)

    try {
      const landmarker = await getFaceLandmarker()

      const image = new Image()
      image.src = preview
      await image.decode()

      const detection = landmarker.detect(image)
      const hasFace = (detection.faceLandmarks?.length ?? 0) > 0

      log("face detection result", {
        hasFace,
        landmarkCount: detection.faceLandmarks?.length ?? 0,
      })

      setFaceDetected(hasFace)
      if (hasFace) {
        setWorkflowState("DETECTED")
      } else {
        setWorkflowState("UPLOAD")
        setError("No face detected. Please use a clear portrait.")
      }
    } catch (detectError) {
      const message =
        detectError instanceof Error ? detectError.message : "Face detection failed unexpectedly."
      log("face detection error", { message })
      setFaceDetected(false)
      setWorkflowState("UPLOAD")
      setError(message)
    } finally {
      setIsDetecting(false)
    }
  }, [getFaceLandmarker, preview])

  const openThemeModal = useCallback(() => {
    log("enhance button clicked", {
      faceDetected,
      workflowState,
      hasFile: Boolean(file),
    })
    if (!faceDetected || !file) {
      return
    }
    setThemeModalOpen(true)
  }, [faceDetected, file, workflowState])

  const runTransform = useCallback(
    async (theme: ThemeKey) => {
      if (!file) {
        return
      }

      setSelectedTheme(theme)
      setThemeModalOpen(false)
      setIsEnhancing(true)
      setProcessingStep("Uploading image...")
      setProcessingProgress(20)
      setError(null)

      try {
        // 1) Save image first to get image_url for /api/transform.
        const uploadForm = new FormData()
        uploadForm.append("file", file)
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadForm,
        })
        const uploadPayload = await uploadResponse.json().catch(() => ({}))
        log("upload-for-transform response", {
          status: uploadResponse.status,
          ok: uploadResponse.ok,
          uploadPayload,
        })

        if (!uploadResponse.ok) {
          throw new Error(uploadPayload?.detail || "Upload failed before transform.")
        }

        setProcessingStep("Processing on GPU...")
        setProcessingProgress(65)

        // 2) Trigger FLUX transform with image_url + theme.
        const transformResponse = await fetch("/api/transform", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: uploadPayload.file_url,
            theme,
            prompt_strength: promptStrength,
          }),
        })
        const transformPayload = await transformResponse.json().catch(() => ({}))
        log("transform response", {
          status: transformResponse.status,
          ok: transformResponse.ok,
          transformPayload,
        })

        if (!transformResponse.ok) {
          throw new Error(transformPayload?.detail || "Enhancement request failed.")
        }

        setProcessingProgress(100)
        setEnhancedImageUrl(transformPayload.enhanced_image_url)
        setWorkflowState("ENHANCED")
      } catch (enhanceError) {
        const message =
          enhanceError instanceof Error ? enhanceError.message : "Enhancement failed unexpectedly."
        setError(message)
      } finally {
        setIsEnhancing(false)
        setTimeout(() => {
          setProcessingStep("")
          setProcessingProgress(0)
        }, 500)
      }
    },
    [file, promptStrength]
  )

  const handleThemeSelect = useCallback(
    async (theme: ThemeKey) => {
      log("theme selected", { theme, file: file?.name ?? null })

      if (!isAdmin && PREMIUM_THEMES.includes(theme)) {
        // Customer mode gate: premium themes open pricing modal only.
        setThemeModalOpen(false)
        setPricingModalOpen(true)
        return
      }

      await runTransform(theme)
    },
    [file?.name, isAdmin, runTransform]
  )

  const workflowBadge = useMemo(() => {
    if (workflowState === "ENHANCED") {
      return "ENHANCED"
    }
    if (workflowState === "DETECTED") {
      return "DETECTED"
    }
    return "UPLOAD"
  }, [workflowState])

  return (
    <>
      <ThemeModal
        open={themeModalOpen}
        loading={isEnhancing}
        isAdmin={isAdmin}
        onClose={() => setThemeModalOpen(false)}
        onSelect={handleThemeSelect}
      />

      <PricingModal open={pricingModalOpen} onClose={() => setPricingModalOpen(false)} />

      <div className="rounded-3xl border border-[rgba(91,63,191,0.2)] bg-[rgba(91,63,191,0.06)] p-6 backdrop-blur-xl sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A994E0]">
            Workflow State: {workflowBadge}
          </p>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#f7b5d0]/40 bg-[#D4467E]/15 px-3 py-1 text-xs font-semibold text-[#f7b5d0]">
                <Crown className="h-3.5 w-3.5" />
                Admin
              </span>
            )}
            {faceDetected && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Face Detected
              </span>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="mb-5 rounded-xl border border-[rgba(212,70,126,0.25)] bg-[rgba(212,70,126,0.07)] p-4">
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.15em] text-[#f7b5d0]">
              <span>Prompt Strength</span>
              <span>{promptStrength.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={0.8}
              step={0.01}
              value={promptStrength}
              onChange={(event) => setPromptStrength(Number(event.target.value))}
              className="w-full accent-[#D4467E]"
            />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <ImageUploader file={file} preview={preview} onFileSelect={handleFileSelect} onRemove={handleRemove} />

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={detectFace}
                disabled={!file || isDetecting}
                className="flex items-center justify-center gap-2 rounded-xl border border-[rgba(91,63,191,0.35)] bg-[rgba(91,63,191,0.18)] px-4 py-3 text-sm font-semibold text-white transition-all hover:border-[rgba(91,63,191,0.5)] hover:bg-[rgba(91,63,191,0.26)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanFace className="h-4 w-4" />}
                Detect Face
              </button>

              <button
                type="button"
                onClick={openThemeModal}
                disabled={!faceDetected || isEnhancing}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4467E] to-[#5B3FBF] px-4 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isEnhancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Enhance Face
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(91,63,191,0.25)] bg-[rgba(91,63,191,0.08)] p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#A994E0]">Enhanced Output</h3>

            {isEnhancing ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-[rgba(91,63,191,0.2)] bg-[rgba(91,63,191,0.06)]">
                <div className="w-full max-w-xs px-6">
                  <div className="mb-3 flex items-center gap-2 text-sm text-[#A994E0]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {processingStep || "Processing on GPU..."}
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(91,63,191,0.25)]">
                    <div
                      className="h-full bg-gradient-to-r from-[#D4467E] to-[#5B3FBF] transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : enhancedImageUrl ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-xl border border-[rgba(91,63,191,0.25)] bg-[rgba(91,63,191,0.06)]">
                  <img src={enhancedImageUrl} alt="Enhanced output" className="h-[260px] w-full object-contain" />
                </div>
                <p className="text-xs text-[#A994E0]">
                  Theme: <span className="font-semibold text-white">{selectedTheme ?? "basic"}</span>
                </p>
                <a
                  href={enhancedImageUrl}
                  download
                  className="inline-flex items-center justify-center rounded-lg border border-[rgba(91,63,191,0.35)] bg-[rgba(91,63,191,0.18)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[rgba(91,63,191,0.28)]"
                >
                  Download
                </a>
              </div>
            ) : (
              <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-[rgba(91,63,191,0.2)] bg-[rgba(91,63,191,0.06)] px-5 text-center text-sm text-[#A994E0]">
                Upload an image, detect a face, and choose a theme to generate enhancement.
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
        )}
      </div>
    </>
  )
}
