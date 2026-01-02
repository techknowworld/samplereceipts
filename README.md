# Receipt Images Gallery

A simple static website that shows thumbnails for images in the `images/` folder. Click any thumbnail to preview and download.

## Add your images

1. Put your image files in `images/` (e.g. `images/receipt-01.jpg`).
2. Generate/update `images/manifest.json`:

- PowerShell: `./generate-manifest.ps1`

Or edit `images/manifest.json` manually so `files` lists your filenames.

Supported extensions: `png`, `jpg`, `jpeg`, `webp`, `gif`, `bmp`, `svg`.

## Run locally

No server required (recommended for your case):

- Run `./generate-manifest.ps1`
- Then you can open `index.html` directly from disk and it will use `images/manifest.js`.

Optional (server/hosted mode):

If you prefer, run a tiny local web server (useful for mimicking GitHub Pages and using `images/manifest.json`):

- Python: `python -m http.server 8000`
- Node (if you have it): `npx serve .`

Then open `http://localhost:8000/`.

## Notes

- The gallery first tries `images/manifest.json`. If it’s missing/unreachable, it falls back to an empty list by default (you can also hardcode names in `FALLBACK_IMAGE_FILES` inside `app.js`).
