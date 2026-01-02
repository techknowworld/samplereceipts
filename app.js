const IMAGE_FOLDER = "./images";
const MANIFEST_URL = `${IMAGE_FOLDER}/manifest.json`;

function getInlineManifestFiles() {
  if (typeof window === "undefined") return null;
  const files = window.__IMAGE_MANIFEST_FILES__;
  return Array.isArray(files) ? files.map(String).filter(isImageFile) : null;
}

const FALLBACK_IMAGE_FILES = [];

function isImageFile(name) {
  return /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(name);
}

function joinUrl(folder, file) {
  const folderTrimmed = folder.replace(/\/+$/, "");
  const fileTrimmed = String(file).replace(/^\/+/, "");
  return `${folderTrimmed}/${encodeURI(fileTrimmed)}`;
}

async function loadImageList() {
  const usingFileProtocol =
    typeof location !== "undefined" && String(location.protocol).toLowerCase() === "file:";

  if (usingFileProtocol) {
    const inlineFiles = getInlineManifestFiles();
    if (inlineFiles && inlineFiles.length) {
      return {
        files: inlineFiles,
        source: "inline",
        error: null,
        usingFileProtocol,
      };
    }
  }

  try {
    const response = await fetch(MANIFEST_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`manifest HTTP ${response.status}`);
    }

    const json = await response.json();
    const files = Array.isArray(json) ? json : Array.isArray(json.files) ? json.files : [];

    return {
      files: files.map(String).filter(isImageFile),
      source: "manifest",
      error: null,
      usingFileProtocol,
    };
  } catch (error) {
    const fallbackFiles = FALLBACK_IMAGE_FILES.map(String).filter(isImageFile);
    return {
      files: fallbackFiles,
      source: usingFileProtocol ? "fallback-file" : "fallback",
      error,
      usingFileProtocol,
    };
  }
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"]; 
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

async function getContentLength(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) return null;
    const len = response.headers.get("content-length");
    return len ? Number(len) : null;
  } catch {
    return null;
  }
}

function openViewer({ src, title }) {
  const viewer = document.getElementById("viewer");
  const viewerImg = document.getElementById("viewerImg");
  const viewerTitle = document.getElementById("viewerTitle");
  const viewerMeta = document.getElementById("viewerMeta");
  const downloadLink = document.getElementById("downloadLink");

  viewerTitle.textContent = title;
  viewerMeta.textContent = "";

  viewerImg.src = src;
  viewerImg.alt = title;

  downloadLink.href = src;
  downloadLink.setAttribute("download", title);

  viewer.classList.remove("hidden");
  viewer.classList.add("flex");

  getContentLength(src).then((bytes) => {
    const size = formatBytes(bytes);
    viewerMeta.textContent = size ? size : "";
  });

  document.body.style.overflow = "hidden";
}

function closeViewer() {
  const viewer = document.getElementById("viewer");
  const viewerImg = document.getElementById("viewerImg");

  viewer.classList.add("hidden");
  viewer.classList.remove("flex");

  viewerImg.src = "";
  viewerImg.alt = "";

  document.body.style.overflow = "";
}

function render(result) {
  const grid = document.getElementById("grid");
  const status = document.getElementById("status");
  const files = result.files;

  grid.innerHTML = "";

  if (!files.length) {
    if (result.usingFileProtocol) {
      status.textContent =
        "You opened this page from disk (file://). Run ./generate-manifest.ps1 to create images/manifest.js (recommended), or use a local server (python -m http.server).";
      return;
    }

    if (result.source === "fallback" && result.error) {
      status.textContent =
        "Could not load images/manifest.json. Create it (or run the manifest generator) so the page knows which images to show.";
      return;
    }

    status.textContent =
      "No images listed. Add files to /images and update images/manifest.json (files array).";
    return;
  }

  status.textContent = `${files.length} image${files.length === 1 ? "" : "s"}`;

  for (const file of files) {
    const src = joinUrl(IMAGE_FOLDER, file);

    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "card group overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-left hover:border-slate-600";

    const img = document.createElement("img");
    img.src = src;
    img.alt = file;
    img.loading = "lazy";
    img.className = "aspect-[4/3] w-full object-cover";

    const footer = document.createElement("div");
    footer.className = "px-3 py-2";

    const name = document.createElement("div");
    name.className = "truncate text-sm text-slate-200";
    name.textContent = file;

    const hint = document.createElement("div");
    hint.className = "text-xs text-slate-400";
    hint.textContent = "Click to preview";

    footer.appendChild(name);
    footer.appendChild(hint);

    button.appendChild(img);
    button.appendChild(footer);

    button.addEventListener("click", () => openViewer({ src, title: file }));

    grid.appendChild(button);
  }
}

async function boot() {
  const status = document.getElementById("status");
  status.textContent = "Loading images…";

  const result = await loadImageList();
  render(result);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("refresh").addEventListener("click", boot);
  document.getElementById("closeViewer").addEventListener("click", closeViewer);

  document.getElementById("viewer").addEventListener("click", (event) => {
    if (event.target && event.target.id === "viewer") closeViewer();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeViewer();
  });

  boot();
});
