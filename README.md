# 🧠 AI Meeting Summarizer & Chat Assistant

![Project Status](https://img.shields.io/badge/Status-Active-success)
![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%203-6DB33F?logo=springboot)
![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql)
![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google)

A modern, full-stack SaaS application that transforms raw meeting transcripts into structured, actionable summaries using Google's Gemini AI. The application features a real-time Server-Sent Events (SSE) streaming interface, allowing users to watch summaries generate word-by-word and dynamically chat with their documents to extract specific insights.

---

## ✨ Key Features

* **Intelligent Document Parsing:** Upload raw meeting transcripts (TXT, PDF, DOCX) and instantly extract the text context.
* **Real-time AI Streaming:** Built with Server-Sent Events (SSE) to deliver a low-latency, ChatGPT-like streaming experience for both document summarization and interactive chat.
* **Resilient LLM Integration:** Engineered with a custom API-key rotation pool in Spring Boot to automatically catch LLM rate limits (`HTTP 429 Too Many Requests`) and seamlessly fall back to alternate API keys, ensuring 99% uptime.
* **Context-Aware Chat:** Users can ask specific questions about their uploaded meeting, and the AI answers using *only* the context of that specific transcript.
* **Secure Authentication:** Implements stateless JWT authentication, BCrypt password hashing, and role-based access control to securely manage user data.
* **Premium User Interface:** A responsive, mobile-first design built with Tailwind CSS, featuring dark mode persistence and fluid micro-animations powered by Framer Motion.

---

## 🛠 Tech Stack

### Frontend
* **Framework:** React 18 (Vite)
* **Styling:** Tailwind CSS (Custom Design System)
* **Animations:** Framer Motion
* **State Management:** Zustand
* **Icons:** Lucide React
* **Markdown Rendering:** React Markdown & Remark GFM

### Backend
* **Framework:** Java 17 / Spring Boot 3.5.4
* **Database:** PostgreSQL (Hosted on Supabase)
* **ORM:** Spring Data JPA / Hibernate
* **Security:** Spring Security, JWT (JSON Web Tokens), BCrypt
* **AI Integration:** Google Gemini API (via WebClient & SSE)
* **Document Parsing:** Apache Tika

---

## 🏗 Architecture & Flow

1. **Upload & Parse:** User uploads a transcript on the frontend. The backend parses it using Apache Tika.
2. **Stream Summary:** The backend sends the parsed text to the Gemini LLM. The LLM's response is streamed back to the frontend chunk-by-chunk using a reactive `WebClient` and `SseEmitter`.
3. **Failover Mechanism:** If the primary Gemini key hits a rate limit (429), the Spring Boot service automatically catches the exception and initiates a new stream with a fallback key without interrupting the user experience.
4. **Interactive Chat:** The frontend maintains the context of the summary and original transcript, allowing the user to ask follow-up questions in a real-time chat interface.

---

## 🚀 Running Locally

### Prerequisites
* **Java 17+** and Maven
* **Node.js 18+** and npm
* A **PostgreSQL** database (e.g., a free Supabase project)
* At least one **Google Gemini API Key**

### 1. Backend Setup (Spring Boot)
Navigate to the backend directory:
```bash
cd meetingnotesapp
```

Create a `.env` file based on the provided example:
```bash
cp .env.example .env
```
Fill in your database credentials, Gemini keys, and generate a random 32-character string for the `JWT_SECRET`.

Run the backend server:
```bash
mvn clean spring-boot:run
```
*The backend will start on `http://localhost:8080`.*

### 2. Frontend Setup (React)
Open a new terminal and navigate to the frontend directory:
```bash
cd meeting-notes-ui
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```
*The frontend will start on `http://localhost:5173`.*

---

## 📸 Screenshots

*(Add screenshots of your application here before publishing to your portfolio! Suggested shots: The dashboard, the streaming summary generation, the chat interface, and the dark/light mode toggle.)*

---

## 🛡 Security Notes

* All environment variables and secrets are strictly excluded from version control.
* Passwords are never stored in plaintext (BCrypt hashing).
* API endpoints are secured via JWT filters, preventing unauthorized data access.

---

*Designed and developed by [Your Name]*
