# ReachInbox Email Scheduler

A production-grade email scheduler service and dashboard, mimicking a slice of the ReachInbox system.

## 🚀 Architecture Overview

This project consists of:
- **Backend**: Node.js, Express, TypeScript, BullMQ, Redis, PostgreSQL (Prisma), NodeMailer (Ethereal).
- **Frontend**: Next.js, React, Tailwind CSS, Google OAuth.

### How Scheduling Works
1. When a user schedules an email from the dashboard, the backend saves it to the PostgreSQL database with a `SCHEDULED` status.
2. It then calculates the delay between the current time and the `scheduledAt` time.
3. The job is placed into a **BullMQ** queue with `{ delay }`. 
4. BullMQ leverages Redis to efficiently handle the delayed job. **No cron jobs are used.**

### Persistence on Restart
If the backend server crashes or restarts, jobs that were already added to the BullMQ queue remain safely persisted in Redis. When the worker comes back online, BullMQ automatically resumes processing the delayed jobs at the correct time. Emails are not lost or restarted from day 1, and duplicate sends are avoided because BullMQ guarantees exactly-once processing (within the worker lock duration) and we check the `status` in the DB before sending.

### Rate Limiting & Concurrency
- **Worker Concurrency**: The BullMQ worker is initialized with a `concurrency` option (configurable via `.env` `WORKER_CONCURRENCY`, defaults to 5), meaning it can process multiple emails in parallel safely.
- **Delay Between Sends**: BullMQ's built-in `limiter` is configured on the Worker (e.g. `limiter: { max: 1, duration: EMAIL_DELAY_MS }`). This ensures that across all jobs, there is a configurable minimum delay between sends (simulating SMTP throttling).
- **Hourly Limits (Per Sender)**: A custom rate-limiter is implemented using Redis. Before sending, the worker checks an hourly counter in Redis (`email_rate_hour:<sender>:<date>`). 
  - If the sender has exceeded their hourly limit (e.g., `MAX_EMAILS_PER_HOUR`), the job is NOT failed.
  - Instead, the worker uses BullMQ's `job.moveToDelayed()` to push the job to the exact start of the next hour window, preserving the queue without losing the email.

## ⚙️ Setup & Running

### 1. Database and Redis (Docker)
Ensure Docker is running, then start the infrastructure:
```bash
docker-compose up -d
```
*(If you cannot run Docker locally, you can change the provider in `backend/prisma/schema.prisma` to `sqlite` and update `DATABASE_URL` in `.env` to `file:./dev.db`.)*

### 2. Backend
Navigate to the `backend` directory:
```bash
cd backend
npm install
# Set up database schema
npx prisma migrate dev --name init
# Run the development server
npm run dev
```
By default, the backend runs on `http://localhost:5000`.

### 3. Frontend
Navigate to the `frontend` directory:
```bash
cd frontend
npm install
# Run the development server
npm run dev
```
By default, the frontend runs on `http://localhost:3000`.

### 4. Ethereal Email Setup
1. Go to [Ethereal Email](https://ethereal.email/) and click "Create Ethereal Account".
2. Copy the SMTP User and Password provided.
3. Paste them into the `backend/.env` file:
   ```env
   ETHEREAL_USER="your-ethereal-user@ethereal.email"
   ETHEREAL_PASS="your-ethereal-password"
   ```

### 5. Environment Variables
- Ensure you have set your `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `frontend/.env.local`.
- Ensure you have set your `GOOGLE_CLIENT_ID` in `backend/.env`.

## ✨ Features Implemented
- **Backend**:
  - API endpoints for scheduling and viewing emails.
  - Full BullMQ persistent scheduler integration (no node-cron).
  - Rate limiting with Redis counters per sender.
  - Delay scheduling via BullMQ limiter and custom reschedule logic (`job.moveToDelayed`).
  - Google OAuth verification endpoint.
- **Frontend**:
  - Clean Next.js + Tailwind UI.
  - Real Google Login via `@react-oauth/google`.
  - Dashboard with Scheduled / Sent views.
  - Form to compose email, upload CSV for leads, and configure delays / limits.
