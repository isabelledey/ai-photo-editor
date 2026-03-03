"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { CheckCircle2, Loader2, ScanFace, Wand2 } from "lucide-react"
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision"

import { ImageUploader } from "@/components/upload/image-uploader"
import { ThemeModal } from "@/components/upload/theme-modal"

type WorkflowState = "UPLOAD" | "DETECTED" | "ENHANCED"
type ThemeKey = "basic" | "festival" | "fantasy" | "corporate"

const LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
const MEDIAPIPE_WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"

export function FaceWorkflow() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [workflowState, setWorkflowState] = useState<WorkflowState>("UPLOAD")
  const [faceDetected, setFaceDetected] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [themeModalOpen, setThemeModalOpen] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey | null>(null)
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const landmarkerRef = useRef<FaceLandmarker | null>(null)

  const log = (event: string, details?: Record<string, unknown>) => {
    console.log(`[FaceWorkflow] ${event}`, {
      timestamp: new Date().toISOString(),
      ...details,
    })
  }

  const resetWorkflowForNewFile = useCallback(() => {
    setWorkflowState("UPLOAD")
    setFaceDetected(false)
    setEnhancedImageUrl(null)
    setSelectedTheme(null)
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
  }, [])

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
        setError("No face detected. Please upload a clearer face image.")
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

  const handleThemeSelect = useCallback(
    async (theme: ThemeKey) => {
      if (!file) {
        return
      }

      log("theme selected", { theme, file: file.name })
      setSelectedTheme(theme)
      setThemeModalOpen(false)
      setIsEnhancing(true)
      setError(null)

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("theme", theme)

        const response = await fetch("/api/enhance", {
          method: "POST",
          body: formData,
        })

        const payload = await response.json().catch(() => ({}))
        log("enhance response", {
          status: response.status,
          ok: response.ok,
          payload,
        })

        if (!response.ok) {
          throw new Error(payload?.detail || "Enhancement request failed.")
        }

        setEnhancedImageUrl(payload.enhanced_image_url)
        setWorkflowState("ENHANCED")
      } catch (enhanceError) {
        const message =
          enhanceError instanceof Error ? enhanceError.message : "Enhancement failed unexpectedly."
        setError(message)
      } finally {
        setIsEnhancing(false)
      }
    },
    [file]
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
        onClose={() => setThemeModalOpen(false)}
        onSelect={handleThemeSelect}
      />

      <div className="rounded-3xl border border-[rgba(91,63,191,0.2)] bg-[rgba(91,63,191,0.06)] p-6 backdrop-blur-xl sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A994E0]">
            Workflow State: {workflowBadge}
          </p>
          {faceDetected && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Face Detected
            </span>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <ImageUploader
              file={file}
              preview={preview}
              onFileSelect={handleFileSelect}
              onRemove={handleRemove}
            />

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
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#A994E0]">
              Enhanced Output
            </h3>

            {isEnhancing ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-[rgba(91,63,191,0.2)] bg-[rgba(91,63,191,0.06)]">
                <div className="flex items-center gap-2 text-sm text-[#A994E0]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing with Replicate...
                </div>
              </div>
            ) : enhancedImageUrl ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-xl border border-[rgba(91,63,191,0.25)] bg-[rgba(91,63,191,0.06)]">
                  <img
                    src={enhancedImageUrl}
                    alt="Enhanced output"
                    className="h-[260px] w-full object-contain"
                  />
                </div>
                <p className="text-xs text-[#A994E0]">
                  Theme: <span className="font-semibold text-white">{selectedTheme ?? "basic"}</span>
                </p>
              </div>
            ) : (
              <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-[rgba(91,63,191,0.2)] bg-[rgba(91,63,191,0.06)] px-5 text-center text-sm text-[#A994E0]">
                Upload an image, detect a face, and choose a theme to generate enhancement.
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>
    </>
  )
}
