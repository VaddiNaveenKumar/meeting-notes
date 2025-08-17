# AI Meeting Notes Summarizer

Full-stack app: upload/paste transcript → custom prompt → AI summary → edit → share via email → history per user.

## Live Links
- Frontend: https://<your-netlify>.netlify.app
- Backend health: https://<your-render>.onrender.com/api/health

## Tech
- Frontend: React + Vite
- Backend: Spring Boot (no Lombok), REST
- AI: Groq chat completions
- Email: SendGrid (verified sender)
- DB: MySQL (Railway)
- Auth: Basic (temp) + X-User-Id for per-user history

## Local Dev
Backend:
- cd meeting-notes-backend
- Set env vars (DB_URL, DB_USER, DB_PASS, GROQ_API_KEY, SENDGRID_API_KEY, MAIL_FROM, APP_AUTH_ENABLED, APP_BASIC_AUTH_USER, APP_BASIC_AUTH_PASS, ALLOWED_ORIGINS=http://localhost:5173)
- mvn spring-boot:run
- Test: GET http://localhost:8080/api/health

Frontend:
- cd meeting-notes-ui
- Create .env with:
  VITE_API_BASE=http://localhost:8080
  VITE_BASIC_USER=admin
  VITE_BASIC_PASS=changeme
- npm install
- npm run dev
- Open http://localhost:5173
