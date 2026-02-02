# surya-painting-backend

Go backend for Surya Painting app.

## Setup

```bash
cd backend
go mod download
cp .env.example .env
```

Set environment variables in `.env`:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (postgresql://...)
- `PORT` (default: 8080)

## Run

```bash
go run main.go
```

## Docker

```bash
docker build -t surya-painting-backend .
docker run -p 8080:8080 --env-file .env surya-painting-backend
```

## API Routes

**Public:**
- `GET /api/branches`
- `GET /api/branches/:id`
- `POST /api/bookings`
- `GET /api/bookings/:code/status`
- `GET /api/payments/banks`
- `POST /api/payments/notify`

**Admin:**
- `GET /api/admin/branches`
- `POST /api/admin/branches`
- `PUT /api/admin/branches/:id`
- `DELETE /api/admin/branches/:id`
- `GET /api/admin/staff`
- `POST /api/admin/staff`
- `GET /api/admin/payments/banks`
- `POST /api/admin/payments/verify`

**Technician:**
- `GET /api/technicians/tasks`
- `PUT /api/technicians/tasks/:id/progress`
