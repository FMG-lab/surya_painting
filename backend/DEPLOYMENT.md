# Go Backend - Deployment Guide

## Prerequisites

1. **Supabase** — DB credentials and migrations applied
2. **Git** — For version control (already set up)
3. **Docker** — For containerization (optional, but recommended)
4. **Deployment Platform** — Choose one:
   - [Render.com](https://render.com) (easiest, free tier available)
   - [Fly.io](https://fly.io) (good performance, free tier)
   - [Google Cloud Run](https://cloud.google.com/run) (pay-per-use, generous free tier)

## Step 1: Apply Database Migrations (if not done)

**Via Supabase SQL Editor:**

```sql
-- Copy-paste entire contents of 001_init.sql
-- Then execute...

-- Copy-paste entire contents of 002_create_public_users_view.sql
-- Then execute...
```

**Verify schema created:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' 
ORDER BY table_name;
```

Expected tables: `branches`, `bookings`, `payments`, `work_progress`

## Step 2: Local Testing

```bash
# Navigate to backend
cd backend

# Copy template and set variables
cp .env.example .env
cat > .env << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
PORT=8080
EOF

# Run locally
go run main.go

# Test in another terminal
curl http://localhost:8080/health
curl http://localhost:8080/api/branches
```

## Step 3: Deploy to Render (Recommended)

### 3.1 Create Render Account & Connect GitHub

1. Go to [render.com](https://render.com) and sign up
2. Connect your GitHub account
3. Grant access to your `suryapainting_app` repository

### 3.2 Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Select your `suryapainting_app` repository
3. Configure:
   - **Name:** `surya-painting-backend`
   - **Environment:** `Docker`
   - **Branch:** `main`
   - **Build command:** (leave empty, uses Dockerfile)
   - **Start command:** (leave empty)

### 3.3 Add Environment Variables

In Render dashboard, under **Environment**:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
PORT=8080
```

### 3.4 Deploy

Click **"Create Web Service"** → Render auto-deploys from main branch

Check status at `https://surya-painting-backend.onrender.com/health`

---

## Step 4: Deploy to Fly.io (Alternative)

### 4.1 Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
fly auth login
```

### 4.2 Initialize Fly App

```bash
cd backend
fly launch --name surya-painting-backend
```

When prompted:
- **Build using Dockerfile?** → Yes
- **Copy Dockerfile to current directory?** → Yes (if not already there)

### 4.3 Set Secrets

```bash
fly secrets set \
  SUPABASE_URL=https://your-project.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=your-key \
  DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
```

### 4.4 Deploy

```bash
fly deploy
```

Check status: `fly open` (opens https://surya-painting-backend.fly.dev)

---

## Step 5: Deploy to Google Cloud Run (Pay-per-use)

### 5.1 Install gcloud CLI

```bash
# macOS
brew install --cask google-cloud-sdk

# Then initialize
gcloud init
gcloud auth login
```

### 5.2 Build & Push Image

```bash
# Set variables
PROJECT_ID="your-gcp-project"
SERVICE_NAME="surya-painting-backend"
REGION="asia-southeast1"  # or your preferred region

# Build and push
gcloud builds submit \
  --tag gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --project=$PROJECT_ID

# Or build locally and push
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest .
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest
```

### 5.3 Deploy to Cloud Run

```bash
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --set-env-vars SUPABASE_URL=https://your-project.supabase.co,SUPABASE_SERVICE_ROLE_KEY=your-key,DATABASE_URL=postgresql://... \
  --allow-unauthenticated
```

Service URL: `https://surya-painting-backend-xxxxx.run.app`

---

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/health` | Health check |
| **GET** | `/api/branches` | List all branches |
| **GET** | `/api/branches/:id` | Get single branch |
| **POST** | `/api/bookings` | Create booking |
| **GET** | `/api/bookings/:code/status` | Check booking status |
| **GET** | `/api/payments/banks` | List payment banks |
| **POST** | `/api/payments/notify` | Notify payment |
| **GET** | `/api/admin/branches` | (Admin) List branches |
| **POST** | `/api/admin/branches` | (Admin) Create branch |
| **PUT** | `/api/admin/branches/:id` | (Admin) Update branch |
| **DELETE** | `/api/admin/branches/:id` | (Admin) Delete branch |
| **GET** | `/api/admin/staff` | (Admin) List staff |
| **POST** | `/api/admin/staff` | (Admin) Create staff |
| **GET** | `/api/admin/payments/banks` | (Admin) List payments |
| **POST** | `/api/admin/payments/verify` | (Admin) Verify payment |
| **GET** | `/api/technicians/tasks` | (Tech) List tasks |
| **PUT** | `/api/technicians/tasks/:id/progress` | (Tech) Update task |

---

## Monitoring & Logging

### Render
- Dashboard: [render.com/dashboard](https://render.com/dashboard)
- Logs: Click service → **Logs** tab

### Fly.io
```bash
fly logs
```

### Cloud Run
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit 50 --format json
```

---

## Database Connection Troubleshooting

If endpoints return DB errors:

1. **Verify migrations:**
   ```sql
   SELECT COUNT(*) FROM branches;
   SELECT COUNT(*) FROM bookings;
   ```

2. **Check DATABASE_URL format:**
   ```
   postgresql://postgres:password@db.supabase.co:5432/postgres?sslmode=require
   ```
   (Supabase requires `sslmode=require`)

3. **Test connection locally:**
   ```bash
   psql "postgresql://postgres:password@db.supabase.co:5432/postgres"
   ```

4. **Check firewall/IP allowlist** on Supabase dashboard (Settings → Database → IP Whitelist)

---

## Next Steps

- [ ] Run migrations via Supabase SQL editor
- [ ] Test endpoints locally: `go run main.go`
- [ ] Choose deployment platform (Render recommended)
- [ ] Deploy and test via `curl http://api-url/health`
- [ ] Update frontend to point to new backend URL
- [ ] Monitor logs for errors
