// Grab DOM elements once for reuse.
const form = document.getElementById("uploadForm");
const imageInput = document.getElementById("imageInput");
const uploadBtn = document.getElementById("uploadBtn");
const statusText = document.getElementById("statusText");
const uploadContainer = document.getElementById("uploadContainer");
const uploadPrompt = document.getElementById("uploadPrompt");
const uploadedState = document.getElementById("uploadedState");
const uploadedMessage = document.getElementById("uploadedMessage");
const changeImageBtn = document.getElementById("changeImageBtn");
const deleteImageBtn = document.getElementById("deleteImageBtn");

const originalPreview = document.getElementById("originalPreview");
const originalPlaceholder = document.getElementById("originalPlaceholder");
const imageMeta = document.getElementById("imageMeta");

const aiLoading = document.getElementById("aiLoading");
const aiResults = document.getElementById("aiResults");
const aiPlaceholder = document.getElementById("aiPlaceholder");

let localPreviewUrl = null;

const yesNoBadge = (value) => {
  const truthy = Boolean(value);
  const color = truthy
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : "bg-rose-100 text-rose-700 border-rose-200";
  const label = truthy ? "Yes" : "No";
  return `<span class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${color}">${label}</span>`;
};

const clearLocalPreviewUrl = () => {
  if (localPreviewUrl) {
    URL.revokeObjectURL(localPreviewUrl);
    localPreviewUrl = null;
  }
};

const setInitialUploadState = () => {
  uploadPrompt.classList.remove("hidden");
  uploadedState.classList.add("hidden");
  uploadContainer.classList.remove("border-emerald-300", "bg-emerald-50");
};

const setUploadedState = (file) => {
  uploadPrompt.classList.add("hidden");
  uploadedMessage.textContent = `Image uploaded: ${file.name}`;
  uploadedState.classList.remove("hidden");
  uploadContainer.classList.add("border-emerald-300", "bg-emerald-50");
};

const clearPreviewAndResults = () => {
  clearLocalPreviewUrl();
  originalPreview.removeAttribute("src");
  originalPreview.classList.add("hidden");
  originalPlaceholder.classList.remove("hidden");

  imageMeta.classList.add("hidden");
  imageMeta.innerHTML = "";

  aiLoading.classList.add("hidden");
  aiResults.classList.add("hidden");
  aiResults.innerHTML = "";
  aiPlaceholder.classList.remove("hidden");
};

const handleFileSelected = (file) => {
  if (!file) {
    return;
  }

  setUploadedState(file);

  // Immediate local preview before server upload completes.
  clearLocalPreviewUrl();
  localPreviewUrl = URL.createObjectURL(file);
  originalPreview.src = localPreviewUrl;
  originalPreview.classList.remove("hidden");
  originalPlaceholder.classList.add("hidden");
};

// Initial prompt and change button both open file picker.
uploadPrompt.addEventListener("click", () => imageInput.click());
changeImageBtn.addEventListener("click", () => imageInput.click());

// Update uploaded state as soon as a file is selected.
imageInput.addEventListener("change", () => {
  if (!imageInput.files || !imageInput.files[0]) {
    return;
  }

  handleFileSelected(imageInput.files[0]);
  statusText.textContent = "Image selected. Click 'Upload & Analyze' to continue.";
});

// Delete action clears input, preview, analysis, and restores initial state.
deleteImageBtn.addEventListener("click", () => {
  imageInput.value = "";
  setInitialUploadState();
  clearPreviewAndResults();
  statusText.textContent = "Choose an image to start.";
});

// Submit upload asynchronously to the FastAPI endpoint.
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!imageInput.files || !imageInput.files[0]) {
    statusText.textContent = "Please select an image file first.";
    return;
  }

  const formData = new FormData();
  formData.append("file", imageInput.files[0]);

  // Loading state while server handles upload + image processing + AI analysis.
  uploadBtn.disabled = true;
  uploadBtn.textContent = "Loading...";
  statusText.textContent = "Loading...";

  aiPlaceholder.classList.add("hidden");
  aiResults.classList.add("hidden");
  aiLoading.classList.remove("hidden");

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.detail || "Upload failed.");
    }

    // Replace local preview with server-served file URL.
    clearLocalPreviewUrl();
    originalPreview.src = data.file_url;
    originalPreview.classList.remove("hidden");
    originalPlaceholder.classList.add("hidden");

    // Render image metadata from backend.
    imageMeta.innerHTML = `
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div><p class="text-xs uppercase tracking-wide text-slate-500">Filename</p><p class="font-semibold text-slate-800">${data.filename}</p></div>
        <div><p class="text-xs uppercase tracking-wide text-slate-500">Dimensions</p><p class="font-semibold text-slate-800">${data.width} x ${data.height}px</p></div>
        <div><p class="text-xs uppercase tracking-wide text-slate-500">Orientation</p><p class="font-semibold text-slate-800">${data.orientation}</p></div>
      </div>
    `;
    imageMeta.classList.remove("hidden");

    const ai = data.ai_analysis || {};

    // Render structured AI findings in the right panel.
    aiResults.innerHTML = `
      <div class="rounded-lg border border-emerald-200 bg-white p-3">
        <p class="text-xs uppercase tracking-wide text-slate-500">Person detected</p>
        <div class="mt-1">${yesNoBadge(ai.person_detected)}</div>
      </div>
      <div class="rounded-lg border border-emerald-200 bg-white p-3">
        <p class="text-xs uppercase tracking-wide text-slate-500">Visible face detected</p>
        <div class="mt-1">${yesNoBadge(ai.face_detected)}</div>
      </div>
      <div class="rounded-lg border border-emerald-200 bg-white p-3">
        <p class="text-xs uppercase tracking-wide text-slate-500">Perceived gender</p>
        <p class="mt-1 text-sm font-semibold text-slate-800">${ai.perceived_gender || "Unknown/Not clear"}</p>
      </div>
    `;

    aiResults.classList.remove("hidden");
    statusText.textContent = "Upload and analysis complete.";
  } catch (error) {
    aiResults.classList.add("hidden");
    aiPlaceholder.classList.remove("hidden");
    statusText.textContent = error.message || "Something went wrong during upload.";
  } finally {
    aiLoading.classList.add("hidden");
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Upload & Analyze";
  }
});

// Ensure default state is consistent on first render.
setInitialUploadState();
