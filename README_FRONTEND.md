# SuryaPaint Frontend (Next.js SSG)

Struktur: `frontend/` (Next.js 14, App Router). Targetnya di-export menjadi file statik sehingga bisa di-host di mana saja (cPanel/Apache, Nginx static, object storage, CDN).

## Fitur
- SSG `output: 'export'` + `images.unoptimized: true`
- Runtime config via `app-config.json` (tanpa rebuild saat pindah server)
- Halaman contoh:
  - Home (`/`)
  - Branches (`/branches`) konsumsi API `/api/v1/branches`

## Konfigurasi
- API base URL dikendalikan di `public/app-config.json`:
  ```json
  { "API_BASE_URL": "https://suryapaint.futuremediatrix.com" }
  ```
- Base path opsional (misal ingin host di subpath `/app`) dengan env:
  - `NEXT_PUBLIC_BASE_PATH=/app`
  - `NEXT_PUBLIC_ASSET_PREFIX=/app`

## Perintah
Di folder `frontend/`:
```bash
npm install
npm run dev     # dev server
npm run build   # build
npm run export  # hasil export di frontend/out
```

## Deploy ke cPanel Apache (subpath /app)
1) Build & export:
```bash
cd frontend
NEXT_PUBLIC_BASE_PATH=/app NEXT_PUBLIC_ASSET_PREFIX=/app npm run build
npm run export
```
2) Upload/rsync isi folder `frontend/out` ke: `/home/.../suryapaint.futuremediatrix.com/app/`
3) Pastikan file `/home/.../suryapaint.futuremediatrix.com/app/app-config.json` berisi `API_BASE_URL` yang benar (boleh copy dari `frontend/public/app-config.json`).
4) Karena `.htaccess` backend sudah melayani file/dir existing apa adanya, konten `/app/` akan tersaji statik tanpa konflik route PHP.

## Pindah ke server lain
- Cukup kopikan hasil export (folder `out/`) ke server tujuan/path mana pun.
- Ubah `app-config.json` di lokasi baru agar `API_BASE_URL` sesuai domain backend.


