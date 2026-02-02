## Dokumentasi Aplikasi Customer

Ringkasan fitur dan integrasi untuk aplikasi customer (web di `/app/` dan acuan untuk Flutter). Aplikasi ini berinteraksi langsung dengan backend Slim PHP dan men-trigger notifikasi admin via WhatsApp (Fonnte).

### URL Aplikasi (Web)
- Base path: `/app/`
- Halaman:
  - `/app/customer/` — Landing customer
  - `/app/customer/booking/new/` — Buat booking
  - `/app/customer/track/` — Lacak status booking
    - Mendukung query `?code=KODE_BOOKING`
  - `/app/customer/payment/notify/` — Konfirmasi pembayaran transfer
    - Mendukung query `?code=KODE_BOOKING` (prefill)

Konfigurasi base API untuk web diatur melalui `app/app-config.json`:
```json
{ "API_BASE_URL": "https://suryapaint.futuremediatrix.com" }
```

---

## Alur Utama

### 1) Buat Booking
- UI: `customer/booking/new`
- Endpoint: `POST /api/v1/bookings` (JSON)
- Body (contoh):
```json
{
  "branch_id": 2,
  "customer_name": "Nama Customer",
  "phone": "0812xxxx",
  "vehicle_type": "motor",
  "items": ["spakbor depan", "bodi kiri"],
  "color": "Merah Candy",
  "notes": "Catatan tambahan",
  "plateNumber": "B 1234 ABC"
}
```
- Response (201):
```json
{
  "message": "Booking dibuat. Silakan lakukan pembayaran.",
  "booking": {
    "id": 12,
    "code": "UUID_32_CHAR",
    "code_human": "SP-BEKASI-2512-0008-DU",
    "status": "pending_payment",
    "branch": { "id": 2, "code": "BEKASI", "name": "Suryapainting18 Bekasi" }
  }
}
```
- Setelah sukses, UI menampilkan dua CTA:
  - Lacak Booking → `/app/customer/track/?code={code_human|code}`
  - Konfirmasi Pembayaran → `/app/customer/payment/notify/?code={code_human|code}`

### 2) Lacak Status Booking
- UI: `customer/track`
- Endpoint: `GET /api/v1/bookings/{code}/status`
  - `code` boleh `code_human` atau `code` (UUID)
- Response (200):
```json
{
  "code": "0B43134...",
  "code_human": "SP-BEKASI-2512-0008-DU",
  "status": "pending_payment",
  "queue_number": null,
  "branch": { "id": 2, "code": "BEKASI", "name": "Suryapainting18 Bekasi" },
  "progress": [
    { "status": "pending_payment", "note": "Menunggu pembayaran", "created_at": "2025-12-17 10:00:00" }
  ]
}
```

### 3) Konfirmasi Pembayaran Transfer
- UI: `customer/payment/notify`
- Bank tujuan (untuk ditampilkan di UI):
  - Endpoint: `GET /api/v1/payments/banks`
  - Response:
```json
{ "banks": [ { "bank": "BCA", "account": "1234567890", "holder": "SURYA PAINT", "notes": "..." } ] }
```
- Submit konfirmasi pembayaran:
  - Endpoint: `POST /api/v1/payments/notify` (multipart/form-data atau JSON)
  - Field yang diterima:
    - `booking_code` (wajib) — `code_human` atau `code`
    - `amount` (wajib) — angka (dalam rupiah, tanpa pemisah)
    - `bank_from` (opsional) — teks
    - `transfer_time` (opsional) — `YYYY-MM-DDTHH:MM`
    - `reference` (opsional) — teks
    - `notes` (opsional) — teks
    - `proof` (opsional) — file gambar (jika multipart)
  - Validasi server:
    - Minimal nominal mengikuti `.env` (`PAYMENT_MIN`) atau override per cabang (`PAYMENT_MIN_BRANCH_{CODE}`).
    - Maksimal nominal opsional (`PAYMENT_MAX` / `PAYMENT_MAX_BRANCH_{CODE}`).
  - Response (200):
```json
{
  "message": "Payment notified",
  "payment": { "id": 10, "status": "pending_review" }
}
```
- Notifikasi admin: dikirim otomatis via **Fonnte** (WhatsApp) dengan format pesan:
```
Konfirmasi pembayaran baru
Booking: SP-BEKASI-2512-0008-DU
Nominal: Rp 150.000
Pelanggan: Nama Customer
Cabang: Suryapainting18 Bekasi [BEKASI]
Bank: BCA
Waktu: 2025-12-17T11:10
Ref: ABC123
Status: https://suryapaint.futuremediatrix.com/app/customer/track?code=SP-BEKASI-2512-0008-DU
```

Catatan: Integrasi WhatsApp Cloud API dan webhook WA telah dihapus. Satu-satunya jalur notifikasi adalah Fonnte.

---

## Endpoint Referensi (Customer-scope)
- `GET /api/v1/branches` — daftar cabang aktif
- `POST /api/v1/bookings` — buat booking
- `GET /api/v1/bookings/{code}/status` — status & progres booking
- `GET /api/v1/payments/banks` — info rekening tujuan pembayaran
- `POST /api/v1/payments/notify` — kirim konfirmasi pembayaran

Format error standar:
```json
{ "error": "Pesan error singkat", "message": "Opsional detail" }
```
Kode status umum:
- 200/201 — berhasil
- 401 — unauthorized (tidak dipakai untuk flow customer publik)
- 404 — booking tidak ditemukan
- 422 — validasi gagal (mis. nominal di bawah minimum)
- 500 — kesalahan server

---

## Panduan Integrasi Flutter
Flutter app akan memanggil endpoint yang sama seperti web. Rekomendasi umum:
- Base URL: `https://suryapaint.futuremediatrix.com`
- Timeout: 10–15 detik
- `Content-Type`:
  - JSON untuk `/api/v1/bookings`
  - Multipart/form-data untuk `/api/v1/payments/notify` jika unggah `proof`

Contoh Dart (http, JSON):
```dart
final url = Uri.parse('$base/api/v1/bookings');
final resp = await http.post(
  url,
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'branch_id': branchId,
    'customer_name': customerName,
    'phone': phone?.isNotEmpty == true ? phone : null,
    'vehicle_type': 'motor',
    'items': items, // List<String>
    'color': color?.isNotEmpty == true ? color : null,
    'notes': notes?.isNotEmpty == true ? notes : null,
    'plateNumber': plateNumber?.isNotEmpty == true ? plateNumber : null,
  }),
);
```

Contoh Dart (http, multipart dengan bukti transfer):
```dart
final uri = Uri.parse('$base/api/v1/payments/notify');
final req = http.MultipartRequest('POST', uri);
req.fields['booking_code'] = bookingCode;
req.fields['amount'] = amount.toString(); // tanpa pemisah, mis. 150000
if (bankFrom?.isNotEmpty == true) req.fields['bank_from'] = bankFrom!;
if (transferTime?.isNotEmpty == true) req.fields['transfer_time'] = transferTime!; // 2025-12-17T11:10
if (reference?.isNotEmpty == true) req.fields['reference'] = reference!;
if (notes?.isNotEmpty == true) req.fields['notes'] = notes!;
if (proofFile != null) {
  req.files.add(await http.MultipartFile.fromPath('proof', proofFile.path));
}
final streamed = await req.send();
final resp = await http.Response.fromStream(streamed);
```

Tracking status (Flutter):
```dart
final url = Uri.parse('$base/api/v1/bookings/${Uri.encodeComponent(code)}/status');
final resp = await http.get(url);
```

### Validasi sisi-klien yang disarankan (Flutter & Web)
- `booking_code` wajib diisi (boleh `code_human` atau `code` UUID).
- `amount` hanya digit dan > 0; tampilkan preview rupiah dengan `NumberFormat` (ID).
- Optional field (`bank_from`, `transfer_time`, `reference`, `notes`) aman untuk dikosongkan.
- Upload `proof` bersifat opsional (jpg/png/webp).

---

## Konfigurasi & Lingkungan
- Backend `.env` yang relevan untuk flow customer:
  - `PAYMENT_MIN`, `PAYMENT_MAX` (opsional global)
  - `PAYMENT_MIN_BRANCH_{CODE}`, `PAYMENT_MAX_BRANCH_{CODE}` (opsional per cabang, `{CODE}` huruf besar)
  - `BANK_NAME`, `BANK_ACCOUNT`, `BANK_HOLDER`
  - `FONNTE_TOKEN` — token API Fonnte (pengirim notifikasi admin)
  - `WHATSAPP_ADMIN_RECIPIENTS` — daftar nomor admin (penerima) dipisah koma; format `628xx…`
- Catatan: Seluruh integrasi WhatsApp Cloud API & webhook telah dihapus.

---

## Catatan Implementasi Web (Next.js)
- Disajikan statik (SSG/export) di `/app/` (Apache/cPanel).
- Base path & asset prefix dapat disetel via env build `NEXT_PUBLIC_BASE_PATH=/app` `NEXT_PUBLIC_ASSET_PREFIX=/app`.
- `app/app-config.json` memungkinkan ganti `API_BASE_URL` tanpa rebuild.

---

## QA Checklist
- [ ] Buat booking → menerima kode (human & UUID)
- [ ] Buka `track/?code=` menampilkan status & progres
- [ ] `payment/notify/?code=` ter-prefill kode, submit valid → 200
- [ ] Admin menerima WA via Fonnte dengan format lengkap
- [ ] Batas minimum/maximum payment bekerja (422 jika tidak valid)


