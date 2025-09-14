-----

# AI Meeting Notes Summarizer 🚀

A full-stack web application that streamlines meeting note management by converting raw meeting transcripts into structured, decision-ready summaries, powered by the **Groq API and Llama models** for ultra-fast summarization.


## 📝 Project Overview

This app empowers users to efficiently transform lengthy meeting transcripts into concise, categorized summaries. Users can either upload or paste their meeting notes and specify how the AI should summarize the content (e.g., “Summarize action items only” or “Summarize for executives”).

The application leverages the **Groq API, running high-performance Llama models**, to produce well-structured summaries highlighting key sections like **Key Points**, **Decisions**, **Action Items**, **Risks**, and **Open Questions**. Generated summaries are fully editable, allowing users to adjust details before sharing them seamlessly via email.

## ✨ Key Features

  - **Upload or Paste Transcripts**: Supports plain text file uploads or direct text pasting.
  - **Custom AI Instructions**: Guide the AI's summarization style with custom prompts.
  - **Blazing-Fast Summaries**: Receive AI-generated, structured summaries in near real-time.
  - **Editable Content**: Easily edit and refine the AI-generated summaries before finalizing.
  - **Email Sharing**: Share summaries directly with multiple recipients from within the app.
  - **Persistent History**: Maintain a complete history of all transcripts and their corresponding summaries per user.
  - **Robust Error Handling**: Includes retry mechanisms for AI API calls to ensure reliability.
  - **Secure Configuration**: Manages API keys and sensitive data securely using environment variables.

## 🛠 Technology Stack

| Layer        | Technologies                                               |
| ------------ | ---------------------------------------------------------- |
| **Frontend** | React, Vite, Axios                                         |
| **Backend** | Spring Boot, Spring Data JPA, Spring Mail                  |
| **Database** | MySQL                                                      |
| **AI** | **Groq API with Llama 3 models, Groq SDK** |
| **Middleware**| RESTful APIs, JSON communication                          |

## 🏗 Technical Architecture

### Frontend

  - Built with **React** and **Vite** for a fast, modern, and simple user experience.
  - Components include a transcript uploader, custom prompt input, an editable summary display, and an email sharing interface.
  - Uses **Axios** for all API communication with the Spring Boot backend.

### Backend

  - Powered by **Spring Boot** to expose a robust set of RESTful APIs.
  - Manages meeting transcripts, AI summary generation, summary edits, and email sharing logic.
  - Utilizes **Spring Data JPA** to store all data in a **MySQL** database for persistence and historical access.

### AI Integration (Groq + Llama)

  - Integrates with the **Groq API** to leverage high-speed Language Models like **Llama 3**.
  - Uses a role-based prompt template (`system`, `user`) to generate concise, bullet-point summaries at exceptional speed.
  - Supports flexible, instruction-driven summarization tailored to user needs.

## 🌐 Live Demo

  - **Frontend URL**: `Wait Soon It getting Ready`
  - **Backend Health Check**: `Wait Soon It getting Ready`

## ⚙️ Getting Started (Local Development)

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

  - Java 17+ (JDK)
  - Apache Maven
  - Node.js & npm
  - MySQL Server
  - A **Groq API Key** (from [console.groq.com](https://console.groq.com/))

### 1\. Backend Setup (Spring Boot)

```bash
# Clone the repository
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name/meeting-notes-backend

# Set the required environment variables.
# Your Groq API key is required for the AI features.
export DB_URL=jdbc:mysql://localhost:3306/your_db_name
export DB_USER=your_db_user
export DB_PASS=your_db_pass
export GROQ_API_KEY=your_groq_api_key
export SENDGRID_API_KEY=your_sendgrid_api_key # or other mail service key
export MAIL_FROM=your-verified-sender@example.com
export APP_AUTH_ENABLED=true
export APP_BASIC_AUTH_USER=admin
export APP_BASIC_AUTH_PASS=changeme
export ALLOWED_ORIGINS=http://localhost:5173

# Run the backend application
mvn spring-boot:run

# The backend will be running on http://localhost:8080
# Test the health endpoint:
curl http://localhost:8080/api/health
```

### 2\. Frontend Setup (React)

```bash
# Navigate to the frontend directory in a new terminal
cd ../meeting-notes-ui

# Create a .env file in this directory
touch .env

# Add the following environment variables to the .env file:
# VITE_API_BASE=http://localhost:8080
# VITE_BASIC_USER=admin
# VITE_BASIC_PASS=changeme

# Install dependencies
npm install

# Run the frontend development server
npm run dev

# Open your browser and navigate to http://localhost:5173
```

## 📂 Repository Structure

```text
/
├── meeting-notes-backend/          # Spring Boot backend source code
│   ├── src/main/java/              # Application Java code (controllers, services, models, etc.)
│   └── src/main/resources/         # Configurations, application.properties
│
└── meeting-notes-ui/               # React + Vite frontend source code
    ├── src/                        # React components, API calls, assets
    └── public/                     # Static assets (index.html, favicon, etc.)
```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
