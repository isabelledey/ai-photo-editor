"use client"

import { useCallback, useState, useRef } from "react"
import Image from "next/image"
import { Upload, ImagePlus, RefreshCw, Trash2 } from "lucide-react"

interface ImageUploaderProps {
  file: File | null
  preview: string | null
  onFileSelect: (file: File, preview: string) => void
  onRemove: () => void
}

export function ImageUploader({ file, preview, onFileSelect, onRemove }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (f: File) => {
      if (!f.type.startsWith("image/")) return
      const url = URL.createObjectURL(f)
      onFileSelect(f, url)
    },
    [onFileSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) handleFile(droppedFile)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0]
      if (selected) handleFile(selected)
    },
    [handleFile]
  )

  const openFilePicker = () => inputRef.current?.click()

  // Hidden file input
  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      onChange={handleInputChange}
      className="hidden"
      aria-label="Upload an image file"
    />
  )

  // Upload zone (no file selected)
  if (!preview) {
    return (
      <div className="flex flex-col items-center gap-6">
        {fileInput}
        <button
          type="button"
          onClick={openFilePicker}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`group relative flex w-full cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed px-8 py-16 transition-all duration-300 ${
            isDragging
              ? "border-[#D4467E] bg-[rgba(212,70,126,0.08)] shadow-xl shadow-[#D4467E]/10"
              : "border-[rgba(91,63,191,0.3)] bg-[rgba(91,63,191,0.06)] hover:border-[rgba(91,63,191,0.5)] hover:bg-[rgba(91,63,191,0.1)]"
          } backdrop-blur-xl`}
        >
          {/* Icon ring */}
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${
              isDragging
                ? "bg-[rgba(212,70,126,0.15)] ring-2 ring-[#D4467E]/30"
                : "bg-[rgba(91,63,191,0.15)] ring-1 ring-[rgba(91,63,191,0.2)] group-hover:bg-[rgba(91,63,191,0.2)] group-hover:ring-[rgba(91,63,191,0.4)]"
            }`}
          >
            {isDragging ? (
              <ImagePlus className="h-9 w-9 text-[#D4467E]" />
            ) : (
              <Upload className="h-9 w-9 text-[#A994E0] transition-colors group-hover:text-white" />
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <p className="text-lg font-semibold text-white">
              {isDragging ? "Drop your image here" : "Drag and drop your image"}
            </p>
            <p className="text-sm text-[#A994E0]">
              or{" "}
              <span className="font-medium text-[#D4467E] underline underline-offset-4">
                browse files
              </span>
            </p>
          </div>

          <p className="text-xs text-[#A994E0]/60">
            Supports JPG, PNG, WebP up to 10MB
          </p>
        </button>
      </div>
    )
  }

  // Preview state (file selected)
  return (
    <div className="flex flex-col items-center gap-6">
      {fileInput}

      {/* Image preview card */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-[rgba(91,63,191,0.25)] bg-[rgba(91,63,191,0.06)] backdrop-blur-xl">
        <div className="relative mx-auto flex aspect-[4/5] max-h-[480px] items-center justify-center p-4">
          <div className="relative h-full w-full overflow-hidden rounded-xl">
            <Image
              src={preview}
              alt="Preview of uploaded image"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 90vw, 500px"
            />
          </div>
        </div>

        {/* File info bar */}
        <div className="flex items-center justify-between border-t border-[rgba(91,63,191,0.15)] px-5 py-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(91,63,191,0.2)]">
              <ImagePlus className="h-4 w-4 text-[#A994E0]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {file?.name}
              </p>
              <p className="text-xs text-[#A994E0]/70">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* File control buttons */}
      <div className="flex w-full gap-3">
        <button
          type="button"
          onClick={openFilePicker}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(91,63,191,0.25)] bg-[rgba(91,63,191,0.08)] px-4 py-3 text-sm font-medium text-[#A994E0] backdrop-blur-sm transition-all hover:border-[rgba(91,63,191,0.45)] hover:bg-[rgba(91,63,191,0.15)] hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Replace File
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[rgba(212,70,126,0.2)] bg-[rgba(212,70,126,0.06)] px-4 py-3 text-sm font-medium text-[#D4467E] backdrop-blur-sm transition-all hover:border-[rgba(212,70,126,0.4)] hover:bg-[rgba(212,70,126,0.12)]"
        >
          <Trash2 className="h-4 w-4" />
          Remove File
        </button>
      </div>
    </div>
  )
}
