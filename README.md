# ChaiGPT

ChaiGPT is a full-stack AI chat application built with Next.js. It streams responses from GPT-4o mini, persists conversations, and can execute a web-search tool when a question needs current information.

## Features

- **Streaming AI chat** — responses are streamed to the interface with the Vercel AI SDK.
- **Tool execution** — the model can call Exa Search for news, current events, prices, scores, weather, and other time-sensitive facts.
- **Controlled tool loop** — each response is limited to three model/tool steps to prevent unbounded execution.
- **Source-aware answers** — web results are summarized with citations from configured news sources.
- **Per-user rate limiting** — Redis allows three chat requests per 60-second window; exceeding the limit returns HTTP `429` and blocks requests for five minutes.
- **Authentication and onboarding** — Clerk protects application routes and synchronizes users with the local database.
- **Persistent chat history** — conversations and messages are stored in PostgreSQL through Prisma.
- **Conversation management** — create, rename, pin, archive, and delete conversations.
- **Custom assistants** — conversations can use a custom system prompt.
- **Ownership checks** — chat and conversation operations verify that the authenticated user owns the requested conversation.

## Tech Stack

- Next.js 16 and React 19
- Vercel AI SDK with GPT-4o mini
- Clerk authentication
- PostgreSQL and Prisma
- Redis with ioredis
- Bun runtime and package manager
- Tailwind CSS

## Getting Started

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment variables

Create a `.env` file and provide:

```env
DATABASE_URL=
REDIS_URL=
OPENAI_API_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

### 3. Prepare the database

```bash
bunx prisma migrate dev
```

### 4. Start the development server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `bun run dev` — start the development server.
- `bun run build` — generate the Prisma client and create a production build.
- `bun run start` — run the production server.
- `bun run lint` — run ESLint.

## How Chat Requests Work

1. Clerk authenticates the request and resolves the local user.
2. Redis applies the per-user request limit.
3. The API verifies conversation ownership and loads message history.
4. GPT-4o mini streams a response and may execute Exa Search when fresh information is required.
5. Completed messages are persisted and the conversation timestamp is updated.

## Rate-Limit Behavior

The current limiter is intentionally simple and applies to the chat API:

- Limit: 3 requests per user
- Window: 60 seconds
- Block duration after exceeding the limit: 300 seconds
- Rejected response: HTTP `429 Too Many Requests`

For production, Redis must be shared by every application instance so limits remain consistent across horizontally scaled deployments.
