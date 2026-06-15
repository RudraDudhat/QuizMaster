# QuizMaster Pro

A full-stack quiz platform for instructors and students — 10 question types, auto-grading + manual essay review, anti-cheat protections, rich attempt analytics, and a brutalist UI.

> Built with Spring Boot 3 (Java 21) on the backend and React 19 + Vite on the frontend, backed by PostgreSQL.

---

## Highlights

- **10 question types** — Multiple Choice (single + multi), True/False, Short Answer, Essay, Fill in the Blank, Ordering, Match the Following, Code Snippet, Image-based.
- **Auto-graded + manually graded** — MCQ / T-F / Ordering / Matching / Fill-in-the-blank are evaluated server-side at submit time; essays go into an admin review queue. Students see "Awaiting instructor review" until the essay is graded, never a misleading score.
- **Anti-cheat suite** — per-attempt question + option shuffling, tab-switch tracking, fullscreen-exit detection, server-side timer + score validation, suspicious-attempt flagging, full audit log of every event during the attempt.
- **Notification system** — in-app notifications for quiz assigned, quiz expiring (scheduler-driven), essay graded, result ready, auto-submit, attempt reset.
- **Groups & assignments** — quizzes are assigned to student groups; students see only quizzes assigned to a group they belong to.
- **Student progress** — dashboard with pass rate, average / best scores, XP, daily streak, groups, recent attempts.
- **Admin tooling** — quiz builder with question bank reuse, category + tag management, bulk CSV import, essay grading queue, full analytics dashboard with score distribution / pass rate / per-question accuracy.
- **Rate limiting** on auth endpoints (login, refresh, password reset) to slow brute-force attacks.
- **Actuator** health / info endpoints for uptime monitoring.

---

## Tech Stack

**Backend**
- Java 21 + Spring Boot 3.4
- Spring Security + JWT (access + refresh tokens)
- Spring Data JPA + Hibernate 6
- PostgreSQL 17
- MapStruct (DTO mapping), Lombok
- OAuth2 client (Google sign-in)
- Spring Mail (SMTP)
- Spring Actuator

**Frontend**
- React 19 + Vite 7
- TailwindCSS 3
- TanStack Query (React Query)
- React Router 7 (lazy-loaded routes)
- React Hook Form + Zod (typed form validation)
- Zustand (auth store)
- Framer Motion (animations)
- Recharts (analytics charts)
- Lenis (smooth scrolling, respects `prefers-reduced-motion`)
- Lucide React (icons)

---

## Project Structure

```
quiz/
├── backend/
│   └── demo/
│       ├── src/main/java/com/quizmaster/
│       │   ├── controller/         REST controllers (admin/, student/, root)
│       │   ├── service/            Business logic
│       │   ├── repository/         Spring Data repos
│       │   ├── entity/             JPA entities
│       │   ├── dto/                Request / response DTOs
│       │   ├── mapper/             MapStruct mappers
│       │   ├── security/           JWT filter, rate limiter, OAuth2 handlers
│       │   ├── scheduler/          Auto-submit + quiz-expiry reminders
│       │   ├── config/             Spring Security, etc.
│       │   ├── util/               HTTP helpers (X-Forwarded-For, etc.)
│       │   ├── enums/              QuestionType, QuizStatus, NotificationType…
│       │   └── exception/          GlobalExceptionHandler
│       └── src/main/resources/
│           └── application.properties
├── frontend/
│   ├── src/
│   │   ├── pages/                  Routes (admin/, student/, auth/)
│   │   ├── components/             common/, ui/, layout/, quiz-taking/
│   │   ├── hooks/                  useAuth, useNotifications, …
│   │   ├── api/                    Axios clients per resource
│   │   ├── store/                  Zustand auth store
│   │   ├── schemas/                Shared Zod schemas (quiz, etc.)
│   │   ├── routes/                 AppRouter
│   │   ├── utils/                  constants, formatters
│   │   └── index.css               Design tokens (CSS variables)
│   └── tailwind.config.cjs
└── quiz-web-app-features.md        Original feature spec
```

---

## Quick Start

### Prerequisites

- **JDK 21** (any vendor; tested on Temurin / Oracle)
- **Node.js 20+** and npm 10+
- **PostgreSQL 14+** running locally (or accessible via URL)
- Maven Wrapper is included — no global Maven install needed

### 1. Create the database

```sql
CREATE DATABASE quizmaster;
CREATE USER postgres WITH PASSWORD 'changeme';
GRANT ALL PRIVILEGES ON DATABASE quizmaster TO postgres;
```

### 2. Configure the backend

Edit `backend/demo/src/main/resources/application.properties` (or set env vars to override the defaults):

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/quizmaster
spring.datasource.username=postgres
spring.datasource.password=changeme

# JWT — must be a Base64 string that decodes to >= 32 bytes
app.jwt.secret=<base64-string-at-least-44-chars>
app.jwt.access-expiration-ms=900000
app.jwt.refresh-expiration-ms=604800000
app.jwt.issuer=quizmaster

# CORS — comma-separated list of allowed origins
app.cors.allowed-origins=http://localhost:5173,http://localhost:3000

# Rate limiting (auth endpoints, per-IP)
app.ratelimit.auth.max-attempts=10
app.ratelimit.auth.window-seconds=60
```

Quick way to generate a valid JWT secret (PowerShell):

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { [byte](Get-Random -Maximum 256) }))
```

### 3. Run the backend

```bash
cd backend/demo
./mvnw spring-boot:run
```

The API listens on `http://localhost:8080`. Health check:

```
GET http://localhost:8080/actuator/health → {"status":"UP"}
```

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Vite serves on `http://localhost:5173`.

### 5. Create your first admin user

1. Register at `http://localhost:5173/register` (creates a STUDENT account).
2. Promote yourself to admin via a one-time SQL update:

   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
   ```

3. Re-login. The sidebar now shows the admin pages.

---

## Features in Depth

### Question types (auto-grading rules)

| Type | Auto-graded? | Rule |
|---|---|---|
| MCQ Single | Yes | Selected option must be the one flagged correct |
| MCQ Multi | Yes | Selected set must equal correct set (no partial credit) |
| True / False | Yes | Matches the option flagged correct (UUID-based; falls back to text) |
| Short Answer | Yes | Student's text must contain **any one** correct keyword (synonyms) |
| Fill in the Blank | Yes | Student's text must contain **all** correct keywords (one per blank) |
| Ordering | Yes | Student's order must equal options sorted by `optionOrder` |
| Match the Following | Yes | Full key→value pair comparison |
| Code Snippet | Yes | Treated as MCQ-single (display includes code block) |
| Image Based | Yes | Treated as MCQ-single (display includes image) |
| Essay | **No** | Admin grades manually via `/admin/grading` |

### Quiz lifecycle

```
DRAFT  ──▶  PUBLISHED  ──▶  ARCHIVED
  ▲           │
  └───────────┘
```

- Publishing fires `QUIZ_ASSIGNED` notifications to every student in every assigned group.
- `QUIZ_EXPIRING` reminders go out hourly (deduped per quiz/student) when a quiz closes within 24 h and the student hasn't completed it.

### Attempt flow

1. Student opens quiz detail → clicks Start.
2. `POST /api/v1/student/quizzes/{uuid}/start` creates a `QuizAttempt` with a server-computed `deadlineAt`.
3. As the student answers, `PUT /api/v1/student/attempts/{uuid}/answers` autosaves every 30 s; the frontend also mirrors answers to `localStorage` so a refresh or crash doesn't lose work.
4. On submit (or auto-submit when the deadline expires) the backend scores all auto-gradable questions and either:
   - Returns a final result, or
   - Marks essay rows as `is_correct = NULL` and the attempt as "pending review".
5. Admin grades essays in `/admin/grading` → marks_obtained / percentage / is_passed are recomputed, rank is updated, student gets `QUIZ_GRADED` + (when all essays are done) `QUIZ_RESULT_READY`.

### Anti-cheat

- Per-attempt shuffle of questions + options
- Tab-switch detection (counter + warning modal + audit log)
- Fullscreen-exit detection
- `beforeunload` warning
- Server-side timer authority — even if the client clock is tampered with, the deadline is computed from `deadlineAt - now()` on every tick
- Audit log records every event (`TAB_SWITCH`, `FULLSCREEN_EXIT`, `HINT_REVEALED`, …)
- Optimistic locking (`@Version`) on `QuizAttempt` prevents auto-submit + manual-submit races

### Notifications

| Type | When |
|---|---|
| `QUIZ_ASSIGNED` | Quiz transitions DRAFT → PUBLISHED |
| `QUIZ_EXPIRING` | Hourly scheduler — quiz closes within 24 h, student hasn't completed it |
| `QUIZ_AUTO_SUBMITTED` | Deadline expires while attempt is IN_PROGRESS |
| `QUIZ_GRADED` | Admin grades a single essay answer |
| `QUIZ_RESULT_READY` | Last pending essay on an attempt is graded |
| `ATTEMPT_RESET` | Admin resets a student's attempts on a quiz |

---

## Operational Endpoints

Public:

- `GET /actuator/health` — high-level status
- `GET /actuator/health/liveness` and `/readiness` — Kubernetes probes
- `GET /actuator/info` — build info (`info.app.name`, `info.app.version`)

Authenticated:

- All other `/actuator/**` endpoints require a valid JWT.

---

## Security Notes

- **Refresh tokens are stored in `localStorage`** in the current build. For production, swap to an HttpOnly, SameSite=Strict cookie. This is on the roadmap.
- **JWT secret** must be Base64-encoded and decode to ≥ 32 bytes (JJWT 0.12 requirement). The example in `application.properties` is a placeholder — replace it.
- **Database password** in `application.properties` is a default for local dev. Override via the `SPRING_DATASOURCE_PASSWORD` env var in any other environment.
- **Rate limiting** is in-memory and per-instance. If you scale horizontally, swap `AuthRateLimiter` for a Redis-backed implementation.
- **CORS** is closed by default — only origins in `app.cors.allowed-origins` can call the API with credentials.

---

## Production Build

```bash
# Backend (jar)
cd backend/demo
./mvnw clean package -DskipTests
java -jar target/demo-0.0.1-SNAPSHOT.jar

# Frontend (static assets)
cd frontend
npm run build
# Serves from frontend/dist — point any static host (nginx, Caddy, S3) at it.
```

---

## Environment Variables

Anything in `application.properties` can be overridden via env vars (Spring's relaxed binding):

| Env var | Default |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/quizmaster` |
| `SPRING_DATASOURCE_USERNAME` | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | — |
| `APP_JWT_SECRET` | Base64 string ≥ 44 chars |
| `APP_JWT_ACCESS_EXPIRATION_MS` | `900000` (15 min) |
| `APP_JWT_REFRESH_EXPIRATION_MS` | `604800000` (7 days) |
| `APP_CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` |
| `APP_RATELIMIT_AUTH_MAX_ATTEMPTS` | `10` |
| `APP_RATELIMIT_AUTH_WINDOW_SECONDS` | `60` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth2 (optional) |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP (optional, for password reset emails) |

Frontend reads `VITE_API_BASE_URL` from `frontend/.env`:

```
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

---

## Roadmap / Known Limitations

- HttpOnly refresh-token cookie (currently in `localStorage`)
- Flyway migrations (currently `ddl-auto=update`)
- Redis-backed rate limiter for multi-instance deployments
- Badge / achievement system
- Admin announcements + direct messages to students
- Test coverage for `AttemptService` scoring + deadline / cooldown logic

---

## Contributing

1. Fork the repo and create a feature branch from `main`.
2. Run the frontend lint check (`npm run lint`) and backend build (`./mvnw compile`) before pushing.
3. Open a pull request describing the change and any DB / API impact.

---

## License

MIT — see `LICENSE` for the full text. Use it however you like; no warranty.
