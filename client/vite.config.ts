import path from "node:path"

import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig(({ command }) => {
  const isBuild = command === "build"

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname),
      },
    },
    // Use root in dev, but /static/ for FastAPI-served production builds.
    base: isBuild ? "/static/" : "/",
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
    server: {
      proxy: {
        "/api": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
        },
        "/uploads": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
        },
      },
    },
  }
})
