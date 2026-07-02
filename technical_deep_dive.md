# 🧠 MeetingNoteAI: Technical Deep Dive & Architecture

**MeetingNoteAI** is a production-ready, full-stack Software-as-a-Service (SaaS) application designed to solve the problem of overwhelming meeting transcripts. It transforms raw meeting notes (TXT, PDF, DOCX) into structured, highly actionable summaries using Google's Gemini Large Language Model (LLM). 

Beyond standard summarization, it features a **real-time Server-Sent Events (SSE) streaming architecture** that delivers a ChatGPT-like experience, allowing users to watch their summaries generate word-by-word and dynamically "chat" with their documents to extract specific insights.

---

## 📑 Table of Contents
1. [Core Features](#-core-features)
2. [Comprehensive Tech Stack](#-comprehensive-tech-stack)
3. [System Architecture & Design](#-system-architecture--design)
4. [Deep Dive: Technical Workflows](#-deep-dive-technical-workflows)
   - [Authentication & Security](#1-authentication--security-workflow)
   - [Document Processing](#2-document-upload--parsing-workflow)
   - [AI Streaming (SSE)](#3-ai-summarization--sse-streaming-workflow)
   - [LLM Resilience (Key Pooling)](#4-llm-rate-limit-resilience-key-pooling)
   - [Context-Aware Chat](#5-interactive-chat-workflow)
5. [Database Schema](#-database-schema)
6. [UI/UX & Design System](#-uiux--design-system)

---

## ✨ Core Features

* **Intelligent Document Parsing:** Seamlessly processes `.txt`, `.pdf`, and `.docx` files, extracting raw text context instantly.
* **Real-time AI Streaming:** Delivers ultra-low latency responses by streaming LLM outputs chunk-by-chunk directly to the UI.
* **Context-Aware Document Chat:** Users can ask highly specific questions (e.g., "What did John say about Q3 metrics?") and the AI will answer using *only* the context of the uploaded transcript.
* **Resilient API Key Pooling:** A custom backend mechanism that automatically catches LLM rate limits (`HTTP 429`) and transparently falls back to alternate API keys without interrupting the user's stream.
* **Robust Security:** Implements stateless JSON Web Token (JWT) authentication, BCrypt password hashing, and strict Spring Security filter chains.
* **Premium User Experience:** A responsive, mobile-first interface featuring a meticulously crafted Tailwind CSS design system, dark mode persistence, and fluid micro-animations via Framer Motion.

---

## 🛠 Comprehensive Tech Stack

### Frontend Architecture (Client-Side)
* **Core Framework:** React 18 built with Vite for rapid Hot Module Replacement (HMR).
* **State Management:** Zustand (for lightweight, global state management like theme and auth).
* **Styling & Layout:** Tailwind CSS with a custom-defined color palette and spacing system.
* **Animations:** Framer Motion for layout transitions and micro-interactions.
* **Icons:** Lucide React.
* **Markdown Rendering:** `react-markdown` and `remark-gfm` to securely render AI-generated markdown responses.
* **Routing:** React Router DOM (v6).
* **Network Client:** Axios (for standard REST calls) and native `fetch` (for SSE streaming).

### Backend Architecture (Server-Side)
* **Core Framework:** Java 17 & Spring Boot 3.5.4.
* **Database:** PostgreSQL (Hosted on Supabase).
* **ORM / Data Access:** Spring Data JPA / Hibernate.
* **Security:** Spring Security & `io.jsonwebtoken` (JJWT) for auth.
* **AI Integration:** Spring WebFlux (`WebClient`) for reactive, non-blocking HTTP calls to the Google Gemini API.
* **Document Parsing:** Apache Tika for robust extraction of text from diverse file formats.
* **Environment Management:** `spring-dotenv` for seamless `.env` variable injection during local development.

---

## 🏗 System Architecture & Design

The application follows a decoupled **Client-Server architecture** communicating over a RESTful API and Server-Sent Events (SSE).

```text
[ React Frontend (Vite) ]  <--- (REST / JSON) --->  [ Spring Boot Backend ]
           |                                                |
           | <--- (SSE text/event-stream) ---               |
           |                                                v
[ LocalStorage (JWT) ]                              [ PostgreSQL DB ]
                                                            |
                                                            v
                                                    [ Gemini API ]
```

1. **Decoupling:** The frontend and backend are completely separate codebases. They communicate purely via HTTP. CORS is strictly configured to only allow requests from the verified frontend origin.
2. **Stateless Backend:** The backend holds no session state. Every protected request must carry a valid JWT in the `Authorization: Bearer <token>` header.
3. **Reactive Streaming:** To handle long-running LLM generation, the backend utilizes Spring's `SseEmitter` to hold HTTP connections open, asynchronously writing data chunks to the client as they arrive from the Gemini API.

---

## 🔍 Deep Dive: Technical Workflows

### 1. Authentication & Security Workflow
Security is handled via a stateless JWT mechanism.
* **Registration:** User submits email/password. Backend hashes the password using `BCryptPasswordEncoder` (strength 10) and saves the `AppUser` to PostgreSQL.
* **Login:** User submits credentials. Backend verifies the BCrypt hash. If valid, `JwtService` generates a signed JWT containing the user's ID and `ROLE_USER` claim, with a 24-hour expiration.
* **Authorization:** Every incoming request to `/api/**` (except `/auth`) is intercepted by `JwtAuthenticationFilter`. The filter parses the header, validates the signature, extracts the subject, and constructs a `UsernamePasswordAuthenticationToken`, placing it into the `SecurityContextHolder`.

### 2. Document Upload & Parsing Workflow
* **Upload:** The frontend allows drag-and-drop or file selection. A `FormData` object containing the `MultipartFile` is POSTed to the backend.
* **Parsing:** The `DocumentController` routes the file to Apache Tika. Tika intelligently identifies the MIME type (PDF, DOCX, etc.) and extracts the raw text.
* **Storage:** The extracted text is saved in the database as a `Transcript` entity tied to the authenticated user. The frontend receives the raw text and displays it in the editor.

### 3. AI Summarization & SSE Streaming Workflow
* **Trigger:** The user selects a prompt (e.g., "Executive Summary") and clicks Generate.
* **Request:** The frontend initiates a `fetch` request to `/api/summary/stream`, appending the JWT.
* **Reactive WebClient:** The backend's `GeminiService` constructs a prompt combining the transcript and the user's instructions. It uses a reactive `WebClient` to call the Gemini API's `streamGenerateContent` endpoint.
* **SSE Emitter:** Spring Boot returns an `SseEmitter` to the client immediately. As the `WebClient` receives Flux chunks from Gemini, it writes them into the `SseEmitter`.
* **Client Rendering:** The React frontend reads the `ReadableStream` reader, appending chunks to a state variable. `react-markdown` continuously re-renders the text, creating a smooth typewriter effect.

### 4. LLM Rate Limit Resilience (Key Pooling)
A critical engineering challenge was handling strict rate limits (HTTP 429) from the free-tier Gemini API.
* **The Problem:** If a user generates a long summary, the API might reject subsequent requests.
* **The Solution:** The backend implements a custom `GeminiConfig` that loads an array of up to 5 API keys from environment variables.
* **The Mechanism:** 
  1. A `currentKeyIndex` integer tracks the active key.
  2. If the `WebClient` catches a `WebClientResponseException.TooManyRequests` (429), it triggers a fallback sequence.
  3. The backend increments the key index, logs the rotation, and recursively retries the exact same LLM request with the new key.
  4. This happens instantaneously server-side; the user's frontend stream never breaks.

### 5. Interactive Chat Workflow
* **Context Retention:** When chatting, the backend needs to know *what* the user is asking about. 
* **Payload:** The frontend sends the original `transcript`, the generated `summary`, and the new `userMsg`.
* **Prompt Engineering:** The backend wraps this data in a strict prompt template instructing the LLM: *"You are an assistant. Answer the user's question using ONLY the provided transcript context."*
* **Streaming:** The response is streamed back to the frontend using the exact same SSE mechanism as the summarization.

---

## 🗄 Database Schema

The PostgreSQL database utilizes a relational model mapped via Spring Data JPA/Hibernate.

### `app_users`
* `id` (UUID, Primary Key)
* `email` (String, Unique)
* `password_hash` (String, BCrypt)
* `role` (String, default: "ROLE_USER")
* `created_at` (Timestamp)

### `transcripts`
* `id` (UUID, Primary Key)
* `user_id` (UUID, Foreign Key -> `app_users`)
* `content` (Text, the raw extracted text)
* `created_at` (Timestamp)

### `summaries`
* `id` (UUID, Primary Key)
* `transcript_id` (UUID, Foreign Key -> `transcripts`)
* `user_id` (UUID, Foreign Key -> `app_users`)
* `title` (String)
* `content` (Text, the AI generated summary)
* `created_at` (Timestamp)

---

## 🎨 UI/UX & Design System

The frontend was designed with a focus on modern SaaS aesthetics, prioritizing readability, interaction feedback, and performance.

* **Design Tokens:** Tailwind is configured with custom `accent` (primary brand color) and `surface` (backgrounds/borders) scales, ensuring a cohesive look across both Light and Dark modes.
* **Layout:** A flexible grid/flexbox system that stacks gracefully on mobile devices.
* **Animations:** `framer-motion` is utilized for:
  * Modal popups (spring physics).
  * Toast notifications (slide up/fade).
  * Chat message bubbling.
* **Typography:** Utilizes system sans-serif fonts optimized for legibility in dense text documents.
