import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router-dom"

import { LandingPage } from "@/components/landing-page"
import UploadPage from "@/app/upload/page"
import "../app/globals.css"

type ErrorBoundaryState = {
  hasError: boolean
  errorMessage: string
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: "",
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  }

  componentDidCatch(error: unknown) {
    // Surface runtime errors in the browser console and in-UI fallback.
    // eslint-disable-next-line no-console
    console.error("Root render error:", error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-[#170C59] p-8 text-white">
          <h1 className="text-2xl font-bold">App Render Error</h1>
          <p className="mt-4 text-sm opacity-80">{this.state.errorMessage}</p>
        </main>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </RootErrorBoundary>
  </React.StrictMode>,
)
