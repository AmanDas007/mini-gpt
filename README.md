Mini-GPT 🚀

An Enterprise-Grade AI Chat Application with Context-Aware Memory, RAG, and Rate Limiting.

Mini-GPT is a highly optimized, full-stack AI chat interface built with Next.js 14. Powered by Groq's lightning-fast inference engine, it moves beyond basic API wrappers by implementing a custom sliding-window memory architecture, Retrieval-Augmented Generation (RAG) for document intelligence, multi-layer rate limiting, and real-time response streaming.

"Deployment Status" (https://img.shields.io/badge/Deployment-Vercel-success)
"Next.js" (https://img.shields.io/badge/Next.js-14-black)
"MongoDB" (https://img.shields.io/badge/MongoDB-Atlas-green)
"Redis" (https://img.shields.io/badge/Redis-Upstash-red)
"Groq" (https://img.shields.io/badge/AI-Groq-f55036)

---

🌍 Live Demo

Access the deployed application here: https://mini-gpt-j46a.vercel.app

(Note: You can test the application by signing in with Google, GitHub, or by creating a standard email/password account.)

---

🧠 Core Architecture: Memory + RAG Engine

The standout feature of Mini-GPT is its custom state-management and retrieval architecture designed to preserve conversational context, enable document-grounded answers, and strictly manage token limits and API costs:

1. Sliding Window Context

Tracks exact prompt tokens. The most recent interactions are preserved flawlessly in the active context window.

2. Dynamic Summarization

Once the unsummarized message history hits the "SUMMARIZATION_LIMIT", a background process triggers a secondary LLM pipeline at "temperature: 0" to condense older messages into a rolling "runningSummary".

3. Global Memory Injection

Core user facts and system directives are injected at the top of the context tree, ensuring the AI never forgets fundamental constraints.

4. Retrieval-Augmented Generation (RAG)

Users can upload documents and chat directly with them. Uploaded files are:

- Parsed and chunked efficiently.
- Converted into vector embeddings.
- Stored inside a vector database namespace.
- Retrieved semantically during conversations using similarity search.

The retrieved document context is then merged with the live chat history and memory system before being sent to the LLM, enabling highly contextual and grounded responses without breaking the existing conversational memory pipeline.

---

✨ Key Features

- ⚡ Ultra-Fast Streaming: Utilizing the Groq API for near-instantaneous text generation and a seamless, "live typing" UX.

- 📄 Document Upload + AI Chat (RAG):
  
  - Upload PDFs, text files, or documents.
  - Semantic retrieval over uploaded content.
  - Context-aware answers grounded in user documents.
  - Works seamlessly alongside persistent chat memory.

- 🧠 Hybrid Memory System:
  
  - Sliding-window conversational memory.
  - Rolling summarized memory for long conversations.
  - Global memory injection for persistent instructions.

- 📜 Infinite Scroll Pagination: Server-side paginated chat history ensures rapid initial page loads, easily handling thousands of past messages without freezing the client.

- 🛡️ Multi-Layer Rate Limiting:
  
  - Spam Protection: Upstash Redis enforces a strict 60-second cooldown if a user exceeds message velocity limits.
  - Daily Quotas: MongoDB tracks 24-hour global limits to prevent abuse and manage API usage.

- 🔐 Secure Authentication: Seamless integration with NextAuth.js supporting Google OAuth, GitHub OAuth, and encrypted Email/Password credentials.

- 🎨 Liquid UI/UX:
  
  - Dynamic profile avatars with smart fallbacks.
  - Custom React Markdown rendering with syntax highlighting.
  - "Copy Code" functionality.
  - Global UI lock during active rate limits.
  - Real-time streaming responses.

---

🛠️ Tech Stack

Frontend

- Next.js 14 (App Router)
- Tailwind CSS
- Lucide React

Backend

- Next.js Serverless API Routes

Databases & Storage

- MongoDB Atlas (User profiles, chat history, credentials)
- Upstash Redis (Caching + rate limiting)
- Vector Database for embeddings and semantic retrieval

AI Infrastructure

- Groq API (LLM inference)
- Embedding model pipeline for RAG

Authentication

- NextAuth.js

---

🚀 Getting Started

1. Environment Variables

Create a ".env.local" file in the root directory and configure the following keys:

# Database
MONGODB_URI=your_mongodb_uri

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# NextAuth
NEXTAUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
GITHUB_ID=your_github_id
GITHUB_SECRET=your_github_secret

# AI APIs
GROQ_API_KEY=your_groq_api_key

# Vector Database (Example: Pinecone)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name

# Embeddings
HF_TOKEN=your_huggingface_token
