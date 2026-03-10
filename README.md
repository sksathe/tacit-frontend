# Tacit - Knowledge Capture Platform

Tacit is an end-to-end knowledge capture platform that combines a React frontend, Express backend API, and an MCP (Model Context Protocol) server for voice agent integration with ElevenLabs.

## Project Structure

```
tacit_landing/
├── src/                    # Frontend (React + Vite)
├── server-api/             # Backend API (Express)
├── mcp-agent/              # MCP Server (for ElevenLabs)
└── supabase/
    └── sql/               # Database migrations
```

## How to theme

The app uses a **design-token system** so you can change the look from one place.

- **Edit tokens:** In the **root app** (Vite), all theme variables live in `src/index.css` under `:root` and `.dark`. In **tacit_frontend** (Next.js), they live in `tacit_frontend/src/app/globals.css`. Change `--primary`, `--background`, `--foreground`, `--muted`, `--radius`, shadows, etc. there. All colors are in HSL (e.g. `--primary: 160 84% 39%;`).
- **Toggle dark mode:** Add or remove the `.dark` class on the root element (`<html>`). The root app sets it in code (e.g. in `App.tsx`); tacit_frontend sets it on `<html className="dark">` in `layout.tsx`. Remove the class or switch it dynamically to use light theme.
- **Avoid hardcoded colors:** Prefer semantic Tailwind classes (`bg-primary`, `text-muted-foreground`, `border-border`) or CSS variables (`var(--primary)`) instead of hex/rgb in new code. Optional: add an ESLint `no-restricted-syntax` rule (e.g. match `Literal` with hex regex) to warn on raw hex color strings in JSX/TSX.

## System Flow

1. User logs into Tacit (Supabase Auth)
2. UI lists projects available to the user; user selects a project
3. UI lets user schedule a new call for that project (title, agenda, start/end time, invitees)
4. Backend generates a speakable meeting_code and sends invite emails
5. Invitee calls Twilio number. Twilio routes call into ElevenLabs
6. ElevenLabs connects to our MCP server (this is the agent)
7. Agent asks verification (spoken only): "Say your name and meeting code"
8. Agent uses MCP tools to verify + fetch meeting context (agenda) and then runs the conversation
9. Post-call: Agent (via MCP tools) persists transcript + summary + metadata to Supabase
10. UI shows previous session artifacts for the selected project

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Resend account (for email) or SendGrid
- Twilio account (for phone numbers)
- OpenAI API key (for summaries) or Anthropic API key
- ElevenLabs account (for voice agent)

## Setup

### 1. Database Setup (Supabase)

Run the SQL migrations in order:

```sql
-- In Supabase SQL Editor, run:
-- 1. supabase/sql/01_extensions.sql
-- 2. supabase/sql/02_tables.sql
-- 3. supabase/sql/03_rls.sql
```

Create a storage bucket named `tacit-artifacts` (private bucket).

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values (frontend-only env vars):

```bash
cp .env.example .env
```

For `server-api`:
```bash
cd server-api
cp .env.example .env
# Edit .env with your values
```

For `mcp-agent`:
```bash
cd mcp-agent
cp .env.example .env
# Edit .env with your values
```

**Note:** Backend secrets belong only in `server-api/.env` and `mcp-agent/.env`.

### 3. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend API:**
```bash
cd server-api
npm install
```

**MCP Agent:**
```bash
cd mcp-agent
npm install
```

### 4. Running the Project

#### Option A: Run Everything Separately

**Terminal 1 - Frontend:**
```bash
npm run dev
# Runs on http://localhost:8080
```

**Terminal 2 - Backend API:**
```bash
cd server-api
npm run dev
# Runs on http://localhost:3001
```

**Terminal 3 - MCP Agent:**
```bash
cd mcp-agent
npm run dev
# Runs on http://localhost:3002
```

#### Option B: Use Concurrently (Recommended)

Add to root `package.json`:
```json
{
  "scripts": {
    "dev:all": "concurrently \"npm run dev\" \"cd server-api && npm run dev\" \"cd mcp-agent && npm run dev\""
  }
}
```

Then run:
```bash
npm run dev:all
```

## API Endpoints

### Backend API (server-api)

Base URL: `http://localhost:3001`

Frontend connectivity:
- Local dev: leave `VITE_API_BASE_URL` empty and use the Vite proxy (`/api` -> `VITE_DEV_API_PROXY_TARGET`)
- Preview/prod: set `VITE_API_BASE_URL=https://<your-backend-domain>`

**Projects:**
- `GET /api/projects` - List user's projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create new project

**Meetings:**
- `GET /api/meetings/project/:projectId` - List meetings for a project
- `GET /api/meetings/:id` - Get meeting details
- `POST /api/meetings` - Create new meeting (sends invite emails)
- `PATCH /api/meetings/:id` - Update meeting

**Sessions:**
- `GET /api/sessions/project/:projectId` - List call sessions for a project
- `GET /api/sessions/:id` - Get session details
- `GET /api/sessions/:id/transcript` - Get session transcript
- `GET /api/sessions/:id/summary` - Get session summary

All endpoints require `Authorization: Bearer <supabase-jwt>` header.

### MCP Agent (mcp-agent)

Base URL: `http://localhost:3002`

**Endpoints:**
- `GET /health` - Health check
- `GET /tools` - List available tools
- `POST /tools/call` - Execute a tool
- `POST /mcp` - MCP protocol endpoint

## MCP Tools

The MCP server exposes the following tools for ElevenLabs:

### 1. `create_or_get_call_session`
Creates a new call session or retrieves existing one.

**Input:**
```json
{
  "meeting_code": "bright-star-42",
  "spoken_name": "John Doe",
  "caller_phone": "+1234567890",
  "elevenlabs_conversation_id": "conv_123",
  "now_iso": "2024-01-01T12:00:00Z",
  "idempotency_key": "unique-key-123"
}
```

**Output:**
```json
{
  "call_session_id": "uuid",
  "meeting_id": "uuid",
  "project_id": "uuid",
  "org_id": "uuid",
  "status": "in_progress"
}
```

### 2. `verify_spoken_join`
Verifies caller by matching spoken name and meeting code.

**Input:**
```json
{
  "call_session_id": "uuid",
  "spoken_name": "John Doe",
  "meeting_code": "bright-star-42",
  "idempotency_key": "unique-key-456"
}
```

**Output:**
```json
{
  "status": "verified",
  "attempts_left": 0,
  "message_for_user": "Welcome John Doe!",
  "meeting_context": {
    "title": "Payment Gateway Integration",
    "agenda": "Discuss API endpoints",
    "invitee_name": "John Doe",
    "project_name": "Payment System"
  }
}
```

### 3. `get_meeting_context`
Gets meeting context including agenda and agent hints.

**Input:**
```json
{
  "call_session_id": "uuid"
}
```

### 4. `persist_transcript`
Saves transcript to database and storage.

**Input:**
```json
{
  "call_session_id": "uuid",
  "raw_transcript": {...},
  "normalized_transcript": {...},
  "idempotency_key": "unique-key-789"
}
```

### 5. `persist_summary`
Saves summary to database and storage.

**Input:**
```json
{
  "call_session_id": "uuid",
  "model": "gpt-4o-mini",
  "summary_text": "...",
  "key_points": ["..."],
  "action_items": [...],
  "idempotency_key": "unique-key-101"
}
```

### 6. `finalize_call_session`
Marks call session as completed or failed.

**Input:**
```json
{
  "call_session_id": "uuid",
  "ended_at_iso": "2024-01-01T13:00:00Z",
  "duration_sec": 3600,
  "status": "completed",
  "idempotency_key": "unique-key-202"
}
```

### 7. `generate_summary_from_transcript`
Generates summary from transcript using LLM.

**Input:**
```json
{
  "call_session_id": "uuid",
  "transcript": {...},
  "model": "gpt-4o-mini",
  "idempotency_key": "unique-key-303"
}
```

## ElevenLabs Integration

Configure ElevenLabs to point to your MCP server:

1. In ElevenLabs dashboard, set MCP endpoint: `http://your-domain:3002/mcp`
2. ElevenLabs will discover tools via `tools/list` and call them via `tools/call`

## Database Schema

See `supabase/sql/02_tables.sql` for full schema. Key tables:

- `orgs` - Organizations
- `projects` - Projects within orgs
- `project_members` - User-project relationships
- `meetings` - Scheduled meetings
- `meeting_invitees` - Meeting participants
- `call_sessions` - Actual call instances
- `transcripts` - Call transcripts
- `summaries` - Meeting summaries
- `idempotency_keys` - Prevents duplicate operations

## Security

- **RLS (Row Level Security)**: Enabled on all tables. Users can only read data from projects they belong to.
- **MCP Server**: Uses service role client (bypasses RLS) but derives org/project from meeting_id/call_session_id (never trusts agent inputs).
- **Idempotency**: All write operations use idempotency keys to prevent duplicates.
- **Auth**: Frontend uses Supabase Auth. Backend API validates JWT tokens.

## Development

### Frontend
- Built with Vite + React + TypeScript
- Uses Supabase client for auth and data
- UI components from shadcn/ui

### Backend API
- Express + TypeScript
- Validates Supabase JWT tokens
- Sends invite emails via Resend

### MCP Agent
- Express + TypeScript
- Implements MCP protocol for ElevenLabs
- Uses service role Supabase client
- Handles idempotency for all writes

## Deployment

### Frontend
Deploy to Vercel, Netlify, or similar:
```bash
npm run build
# Deploy dist/ folder
```

### Backend API
Deploy to Railway, Render, Fly.io, or similar:
```bash
cd server-api
npm run build
npm start
```

### MCP Agent
Deploy to Railway, Render, Fly.io, or similar:
```bash
cd mcp-agent
npm run build
npm start
```

Ensure environment variables are set in your deployment platform.

## Troubleshooting

**Database connection errors:**
- Verify `SUPABASE_URL` and keys are correct
- Check Supabase project is active

**Email not sending:**
- Verify `RESEND_API_KEY` is set
- Check Resend domain is verified

**MCP tools failing:**
- Check `SUPABASE_SERVICE_ROLE_KEY` is set
- Verify storage bucket `tacit-artifacts` exists
- Check idempotency keys aren't conflicting

**Frontend can't connect to API:**
- Verify `FRONTEND_ORIGIN` matches frontend URL
- Check CORS settings in server-api

## License

[Your License Here]
