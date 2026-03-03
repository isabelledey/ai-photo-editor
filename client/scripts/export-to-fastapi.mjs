import fs from "node:fs/promises"
import path from "node:path"

const CLIENT_DIR = process.cwd()
const DIST_DIR = path.join(CLIENT_DIR, "dist")
const BACKEND_ROOT = path.resolve(CLIENT_DIR, "..")
const TEMPLATES_DIR = path.join(BACKEND_ROOT, "templates")
const STATIC_DIR = path.join(BACKEND_ROOT, "static")
async function exportBuild() {
  await fs.mkdir(TEMPLATES_DIR, { recursive: true })
  await fs.mkdir(STATIC_DIR, { recursive: true })

  await fs.copyFile(path.join(DIST_DIR, "index.html"), path.join(TEMPLATES_DIR, "index.html"))
  const distEntries = await fs.readdir(DIST_DIR, { withFileTypes: true })

  for (const entry of distEntries) {
    if (entry.name === "index.html") {
      continue
    }

    const source = path.join(DIST_DIR, entry.name)
    const target = path.join(STATIC_DIR, entry.name)
    await fs.rm(target, { recursive: true, force: true })
    await fs.cp(source, target, { recursive: true })
  }

  console.log("Export complete:")
  console.log(`- ${path.join(TEMPLATES_DIR, "index.html")}`)
  console.log(`- ${STATIC_DIR}`)
}

exportBuild().catch((error) => {
  console.error("Failed to export Vite build to FastAPI folders:", error)
  process.exit(1)
})
