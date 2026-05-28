# Auiso Video Platform

Auiso adalah platform video full-stack berbasis React Router 7 yang fokus pada pengalaman menonton, SEO, monetisasi, moderasi, dan fitur real-time.

## Tech Stack

- Runtime dan package manager: Bun 1.3+
- Framework: React Router 7 Framework Mode, Vite, React 19
- Database: Prisma, SQLite untuk development, PostgreSQL/Prisma Accelerate untuk production
- Styling: Tailwind CSS v4 dan shadcn/ui
- Realtime: Supabase Realtime
- Integrasi backend: ConnectRPC/gRPC client, API route React Router, Axios untuk API eksternal
- Deployment: Vercel dengan `@vercel/react-router`
- Testing: Vitest

## Fitur Utama

- Katalog video dengan home feed, kategori, pencarian, rekomendasi, history, bookmark, like, dan komentar.
- SEO dinamis melalui meta route, `sitemap.xml`, `robots.txt`, dan Schema.org `VideoObject`.
- SmartSynopsis untuk internal linking otomatis dari deskripsi video.
- Admin panel untuk video, kategori, tag, komentar, moderasi, ads, revenue, dan block status.
- Monetisasi melalui Google Ads, Facebook Pixel, direct ads, dan checkout campaign.
- Moderasi konten dengan Groq/Llama Guard jika `GROQ_API_KEY` tersedia.
- Integrasi Supabase untuk storage, auth helper, dan realtime comment/player events.
- Age verification, session cookie, RBAC, dan route protection.

## Prasyarat

- Bun 1.3 atau lebih baru
- Database lokal atau remote yang kompatibel dengan Prisma
- Akun Supabase jika ingin memakai storage dan realtime
- Environment variable production di Vercel

## Instalasi

```bash
bun install
```

## Environment Variables

Buat file `.env` di root project untuk development lokal.

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="change-this-secret"

SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

EXA_API_KEY="your-exa-api-key"
GROQ_API_KEY="your-groq-api-key"
SILLY_TAVERN_API_URL="http://127.0.0.1:5000/v1/chat/completions"
SILLY_TAVERN_API_KEY=""

GOOGLE_ADS_CLIENT_ID="your-adsense-client-id"
FB_ADS_PIXEL_ID="your-facebook-pixel-id"
GA_MEASUREMENT_ID="your-ga4-measurement-id"
LOOKER_STUDIO_EMBED_URL="https://lookerstudio.google.com/embed/..."

VOD_API_URL="https://api.example.com"
PEERTUBE_API_URL="https://peertube2.cpy.re"
DOODSTREAM_API_KEY="your-doodstream-api-key"
MONITORING_DOMAIN="auiso.tv"
CRON_SECRET="change-this-cron-secret"
```

Beberapa integrasi bersifat opsional. Jika key tidak tersedia, fitur terkait akan fallback, nonaktif, atau memakai default lokal sesuai implementasi route/server.

## Database

Sinkronkan schema dan generate Prisma Client:

```bash
bunx prisma db push
bunx prisma generate
```

Seed database jika diperlukan:

```bash
bun run prisma/seed.ts
```

## Development

Jalankan aplikasi lokal:

```bash
bun run dev
```

Server berjalan di:

```text
http://localhost:5173
```

Script `dev` hanya menjalankan `react-router dev`. WebSocket/gRPC tidak lagi dijalankan sebagai proses terpisah agar tidak bentrok port saat development atau deploy.

## Build dan Validasi

```bash
bun run typecheck
bun run test
bun run build
```

Build production memakai React Router build dan preset Vercel dari `react-router.config.ts`.

## Deployment ke Vercel

Project ini sudah memakai package `@vercel/react-router` dan preset:

```ts
presets: [vercelPreset()]
```

Konfigurasi ini membuat output build siap dipakai Vercel tanpa server WebSocket/gRPC tambahan. Pastikan semua environment variable production diatur di dashboard Vercel sebelum deploy.

## Keamanan & Anti-Pembajakan

### Penambahan Watermark Statis
Sebelum mengunggah video ke server VOD atau hosting pihak ketiga, admin disarankan untuk menambahkan watermark statis (logo Auiso) ke dalam video menggunakan FFmpeg.

**Contoh Perintah FFmpeg:**
```bash
ffmpeg -i input_video.mp4 -i watermark.png -filter_complex "overlay=W-w-10:H-h-10" -codec:a copy output_video.mp4
```
Keterangan:
- `overlay=W-w-10:H-h-10` menempatkan watermark di sudut kanan bawah dengan jarak 10 piksel dari tepi.
- Setelah diproses, centang opsi "Saya sudah menambahkan watermark" saat menambah/mengedit video di Panel Admin.

## Struktur Penting

- `app/routes`: route halaman dan API
- `app/components`: komponen UI dan fitur client
- `app/lib`: helper server/client, auth, database, Supabase, moderation, recommender
- `app/components/ui`: komponen shadcn/ui
- `prisma`: schema dan seed database
- `proto`: definisi protobuf/gRPC
- `react-router.config.ts`: konfigurasi React Router dan Vercel preset
- `vite.config.ts`: konfigurasi Vite, Tailwind, dan React Router plugin

## Catatan Operasional

- Gunakan Bun untuk install, run, test, dan build.
- Gunakan Prisma untuk akses database dari loader/action.
- Gunakan Supabase Realtime untuk fitur live comment/player event.
- Jangan menjalankan server `ws` atau `grpc` terpisah dari script `dev` kecuali benar-benar sedang menguji service eksternal secara manual.
