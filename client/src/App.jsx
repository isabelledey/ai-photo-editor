import { useEffect, useMemo, useRef, useState } from "react"
import { Crown, Loader2, Lock, ScanFace, Sparkles, Wand2 } from "lucide-react"
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision"

const LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
const MEDIAPIPE_WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"

const THEMES = [
  { key: "basic", label: "Basic", description: "Natural retouching and skin cleanup.", premium: false },
  { key: "festival", label: "Festival", description: "Vibrant festival makeup, glitter, and neon vibes.", premium: true },
  { key: "fantasy", label: "Fantasy", description: "Ethereal goddess makeup, glowing skin, and mystical lighting.", premium: true },
  { key: "corporate", label: "Corporate", description: "Professional studio makeup and executive headshot style.", premium: true },
]

const WORKFLOW = {
  IDLE: "IDLE",
  UPLOADING: "UPLOADING",
  DETECTED: "DETECTED",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
}

function ThemeModal({ open, isAdmin, onClose, onSelect }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#120a45] p-6 backdrop-blur-xl transition-all">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Choose a Theme</h3>
          <button onClick={onClose} className="rounded-md px-3 py-1 text-sm text-[#c7b9ff] hover:bg-white/10">
            Close
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {THEMES.map((theme) => {
            const locked = !isAdmin && theme.premium
            return (
              <button
                key={theme.key}
                onClick={() => onSelect(theme.key, locked)}
                className="rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-[#5B3FBF] hover:bg-white/10"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-semibold text-white">{theme.label}</span>
                  {theme.premium ? (
                    locked ? <Lock className="h-4 w-4 text-pink-300" /> : <Crown className="h-4 w-4 text-pink-300" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-[#b39df8]" />
                  )}
                </div>
                <p className="text-sm text-[#d2c8ff]">{theme.description}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PricingModal({ open, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#120a45] p-6 backdrop-blur-xl transition-all">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Upgrade for Premium Themes</h3>
          <button onClick={onClose} className="rounded-md px-3 py-1 text-sm text-[#c7b9ff] hover:bg-white/10">
            Close
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-widest text-[#b39df8]">Pro</p>
            <p className="mt-2 text-3xl font-bold text-white">$9/mo</p>
            <ul className="mt-3 space-y-2 text-sm text-[#d2c8ff]">
              <li>Festival + Fantasy styles</li>
              <li>Priority GPU queue</li>
              <li>Faster exports</li>
            </ul>
          </div>
          <div className="rounded-xl border border-pink-400/40 bg-pink-400/10 p-4">
            <p className="text-xs uppercase tracking-widest text-pink-300">Enterprise</p>
            <p className="mt-2 text-3xl font-bold text-white">$49/mo</p>
            <ul className="mt-3 space-y-2 text-sm text-[#ffd6ec]">
              <li>All premium styles</li>
              <li>Admin analytics + logs</li>
              <li>Dedicated support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminDashboard({ visible }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)

  const totalRuns = logs.length
  const estimatedCost = (totalRuns * 0.01).toFixed(2)

  const loadLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/logs")
      const payload = await response.json()
      setLogs(payload.logs || [])
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = async () => {
    await fetch("/api/admin/logs", { method: "DELETE" })
    await loadLogs()
  }

  useEffect(() => {
    if (visible) {
      loadLogs()
    }
  }, [visible])

  if (!visible) return null

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Admin Dashboard - Data Logs</h3>
        <button
          onClick={clearLogs}
          className="rounded-lg border border-white/20 px-3 py-2 text-sm text-[#d2c8ff] hover:bg-white/10"
        >
          Clear Logs
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-wider text-[#b39df8]">Total Generations</p>
          <p className="mt-1 text-2xl font-bold text-white">{totalRuns}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-wider text-[#b39df8]">Estimated Cost</p>
          <p className="mt-1 text-2xl font-bold text-white">${estimatedCost}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[#b39df8]">
              <th className="py-2">ID</th>
              <th className="py-2">Timestamp</th>
              <th className="py-2">Theme</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="py-3 text-[#d2c8ff]" colSpan={4}>
                  Loading logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td className="py-3 text-[#d2c8ff]" colSpan={4}>
                  No logs yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-white/5 text-[#e7e0ff]">
                  <td className="py-2">{log.id}</td>
                  <td className="py-2">{log.timestamp}</td>
                  <td className="py-2">{log.theme}</td>
                  <td className="py-2">{log.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [workflowState, setWorkflowState] = useState(WORKFLOW.IDLE)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isFaceDetected, setIsFaceDetected] = useState(false)
  const [promptStrength, setPromptStrength] = useState(0.45)
  const [resultUrl, setResultUrl] = useState(null)
  const [error, setError] = useState("")
  const [themeModalOpen, setThemeModalOpen] = useState(false)
  const [pricingModalOpen, setPricingModalOpen] = useState(false)

  const landmarkerRef = useRef(null)

  const canEnhance = isFaceDetected && Boolean(file) && workflowState !== WORKFLOW.PROCESSING

  const statusLabel = useMemo(() => {
    if (workflowState === WORKFLOW.IDLE) return "Idle"
    if (workflowState === WORKFLOW.UPLOADING) return "Uploading"
    if (workflowState === WORKFLOW.DETECTED) return "Face Detected"
    if (workflowState === WORKFLOW.PROCESSING) return "Processing"
    return "Completed"
  }, [workflowState])

  const onFileChange = (event) => {
    const selected = event.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
    setResultUrl(null)
    setIsFaceDetected(false)
    setWorkflowState(WORKFLOW.IDLE)
    setError("")
  }

  const getLandmarker = async () => {
    if (landmarkerRef.current) return landmarkerRef.current
    const filesetResolver = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_BASE)
    landmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: { modelAssetPath: LANDMARKER_MODEL_URL },
      runningMode: "IMAGE",
      numFaces: 1,
    })
    return landmarkerRef.current
  }

  const detectFace = async () => {
    if (!previewUrl) return
    setError("")

    const image = new Image()
    image.src = previewUrl
    await image.decode()

    const landmarker = await getLandmarker()
    const detection = landmarker.detect(image)
    const hasFace = (detection.faceLandmarks?.length || 0) > 0

    if (!hasFace) {
      setIsFaceDetected(false)
      setWorkflowState(WORKFLOW.IDLE)
      setError("No face detected. Please use a clear portrait.")
      return
    }

    setIsFaceDetected(true)
    setWorkflowState(WORKFLOW.DETECTED)
  }

  const onThemePick = async (theme, locked) => {
    if (locked) {
      setThemeModalOpen(false)
      setPricingModalOpen(true)
      return
    }

    if (!file) return

    setThemeModalOpen(false)
    setWorkflowState(WORKFLOW.UPLOADING)
    setError("")

    const form = new FormData()
    form.append("file", file)
    form.append("theme", theme)
    form.append("prompt_strength", String(promptStrength))

    setWorkflowState(WORKFLOW.PROCESSING)

    try {
      const response = await fetch("/api/enhance", {
        method: "POST",
        body: form,
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail || "Enhancement failed")
      setResultUrl(payload.enhanced_image_url)
      setWorkflowState(WORKFLOW.COMPLETED)
    } catch (err) {
      setError(err.message || "Enhancement failed")
      setWorkflowState(WORKFLOW.DETECTED)
    }
  }

  return (
    <div className="min-h-screen bg-[#170C59] text-[#e7e0ff]">
      <ThemeModal open={themeModalOpen} isAdmin={isAdmin} onClose={() => setThemeModalOpen(false)} onSelect={onThemePick} />
      <PricingModal open={pricingModalOpen} onClose={() => setPricingModalOpen(false)} />

      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <h1 className="text-xl font-semibold tracking-wide text-white">AI Face Stylizer</h1>
        <label className="flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm">
          <span className="text-[#d2c8ff]">Admin Mode</span>
          <span className={`relative h-6 w-11 rounded-full transition ${isAdmin ? "bg-[#5B3FBF]" : "bg-white/25"}`}>
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="peer sr-only"
            />
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${isAdmin ? "left-5" : "left-0.5"}`} />
          </span>
        </label>
      </nav>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-12 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-semibold text-white">Workflow</h2>
          <p className="mb-4 text-sm text-[#b39df8]">State: {statusLabel}</p>

          <input type="file" accept="image/*" onChange={onFileChange} className="mb-4 block w-full text-sm" />

          {previewUrl && (
            <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-black/20 p-2">
              <img src={previewUrl} alt="Preview" className="h-64 w-full object-contain" />
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={detectFace}
              disabled={!file || workflowState === WORKFLOW.PROCESSING}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ScanFace className="h-4 w-4" />
              Detect Face
            </button>
            <button
              onClick={() => setThemeModalOpen(true)}
              disabled={!canEnhance}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5B3FBF] to-[#7a5be0] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Wand2 className="h-4 w-4" />
              Enhance Face
            </button>
          </div>

          {isAdmin && (
            <div className="mt-4 rounded-xl border border-pink-300/20 bg-pink-300/5 p-4">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-pink-200">
                <span>Prompt Strength</span>
                <span>{promptStrength.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.8"
                step="0.01"
                value={promptStrength}
                onChange={(e) => setPromptStrength(Number(e.target.value))}
                className="w-full accent-[#5B3FBF]"
              />
            </div>
          )}

          {workflowState === WORKFLOW.PROCESSING && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 inline-flex items-center gap-2 text-sm text-[#d2c8ff]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing on GPU...
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 animate-pulse bg-[#5B3FBF]" />
              </div>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-pink-300">{error}</p>}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="mb-4 text-lg font-semibold text-white">Result</h2>
          {resultUrl ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20 p-2">
                <img src={resultUrl} alt="Enhanced" className="h-64 w-full object-contain" />
              </div>
              <a
                href={resultUrl}
                download
                className="inline-flex rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Download
              </a>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-sm text-[#b39df8]">
              Your enhanced image will appear here.
            </div>
          )}
        </section>
      </main>

      <main className="mx-auto w-full max-w-6xl px-6 pb-10">
        <AdminDashboard visible={isAdmin} />
      </main>

      <footer className="border-t border-white/10 px-6 py-6 text-center text-sm text-[#b39df8]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4">
          <a href="/legal/accessibility" className="hover:text-white transition">
            Accessibility Statement
          </a>
          <span className="opacity-40">|</span>
          <a href="/legal/terms" className="hover:text-white transition">
            Terms of Use
          </a>
        </div>
      </footer>
    </div>
  )
}
