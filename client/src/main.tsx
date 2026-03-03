import React from "react"
import ReactDOM from "react-dom/client"

import { LandingPage } from "@/components/landing-page"
import "../app/globals.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LandingPage />
  </React.StrictMode>,
)
