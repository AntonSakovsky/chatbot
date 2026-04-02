# ChatGPT Clone

A full-stack ChatGPT-like chatbot with streaming AI responses, file/image uploads, and anonymous access. Built as a test assignment.

> **NOTE:** If the chat is not responding, enable a VPN — the Google Gemini API may be blocked in your region.

## Tech Stack

| Layer        | Technology                               |
| ------------ | ---------------------------------------- |
| Frontend     | Next.js 16 (App Router) + TanStack Query |
| UI           | shadcn/ui + Tailwind CSS (dark theme)    |
| Backend      | Express.js (TypeScript)                  |
| Database     | Supabase (PostgreSQL)                    |
| Auth         | Supabase Auth — email/password           |
| LLM          | Google Gemini 3.1 Flash Lite             |
| File Storage | Supabase Storage                         |

## Features

- Real-time streaming AI responses (SSE)
- Conversation history with sidebar navigation
- Image paste & file upload (PDF, DOCX, images) with vision support
- Anonymous access — 3 free questions before sign-in prompt
- Email/password authentication
- Auto-generated conversation titles
- Cross-tab sync via Supabase Realtime
- Markdown rendering with syntax highlighting

## Project Structure

```
/
├── client/   # Next.js 16 App Router
└── server/   # Express.js + TypeScript
```

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (free tier: 1500 req/day)

## Setup

### 1. Database

Run the following SQL in your Supabase SQL Editor:

```sql
CREATE TABLE conversations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_token  text,
  title            varchar(255) DEFAULT 'New Chat',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_anonymous_token ON conversations(anonymous_token);

CREATE TABLE messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  uuid REFERENCES conversations(id) ON DELETE CASCADE,
  role             text NOT NULL CHECK (role IN ('user', 'assistant')),
  content          text NOT NULL,
  created_at       timestamptz DEFAULT now()
);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);

CREATE TABLE attachments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id     uuid REFERENCES messages(id) ON DELETE CASCADE,
  file_name      text NOT NULL,
  storage_path   text NOT NULL,
  mime_type      text NOT NULL,
  extracted_text text,
  created_at     timestamptz DEFAULT now()
);
CREATE INDEX idx_attachments_message_id ON attachments(message_id);

CREATE TABLE anonymous_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token          text UNIQUE NOT NULL,
  question_count int DEFAULT 0,
  created_at     timestamptz DEFAULT now(),
  last_active    timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

Also create a storage bucket named `attachments` in Supabase Storage (set it to private).

### 2. Environment Variables

**`server/.env`**

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
PORT=3001
CLIENT_URL=http://localhost:3000
```

**`client/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install Dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 4. Run Locally

Open two terminals:

```bash
# Terminal 1 — server (runs on :3001)
cd server
npm run dev

# Terminal 2 — client (runs on :3000)
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Overview

| Method       | Endpoint                          | Description                   |
| ------------ | --------------------------------- | ----------------------------- |
| GET/POST     | `/api/conversations`              | List / create conversations   |
| PATCH/DELETE | `/api/conversations/:id`          | Update title / delete         |
| GET          | `/api/conversations/:id/messages` | Get messages                  |
| POST         | `/api/conversations/:id/messages` | Send message (SSE stream)     |
| POST         | `/api/upload`                     | Upload file/image             |
| GET          | `/api/anonymous/status`           | Remaining anonymous questions |
| POST         | `/api/anonymous/chat`             | Anonymous SSE chat (max 3)    |
| GET          | `/api/auth/me`                    | Verify JWT, return profile    |

## Deployment (Vercel)

Both apps deploy independently to Vercel.

**Server** — add all `server/.env` variables in the Vercel project settings.

**Client** — add all `client/.env.local` variables, setting `NEXT_PUBLIC_API_URL` to the deployed server URL.
