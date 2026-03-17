# 🎯 QuizMaster Pro — Full Feature Specification

> A modern, role-based quiz web application with two user types: **Admin** and **Student**.  
> Built for speed, fairness, and deep learning insights.

---

## 📋 Table of Contents

1. [Authentication & User Management](#1-authentication--user-management)
2. [Admin — Quiz Management](#2-admin--quiz-management)
3. [Admin — Question Bank](#3-admin--question-bank)
4. [Admin — Timer & Rules Engine](#4-admin--timer--rules-engine)
5. [Admin — Analytics & Reporting](#5-admin--analytics--reporting)
6. [Admin — Student Management](#6-admin--student-management)
7. [Student — Quiz Experience](#7-student--quiz-experience)
8. [Student — Results & Review](#8-student--results--review)
9. [Student — Dashboard & Progress](#9-student--dashboard--progress)
10. [Notifications & Communication](#10-notifications--communication)
11. [Security & Anti-Cheating](#11-security--anti-cheating)
12. [System & Technical Features](#12-system--technical-features)

---

## 1. Authentication & User Management

### 1.1 Registration & Login
- Email/password registration with email verification
- Social login (Google, GitHub OAuth)
- Role-based access: `Admin` and `Student`
- Secure JWT-based session management with refresh tokens
- "Remember Me" functionality (persistent sessions)
- Password strength indicator during registration
- Forgot password / Reset password via email link

### 1.2 Profile Management
- Upload and crop profile picture
- Edit display name, bio, and contact info
- Change password with current password verification
- View account activity log (last login, IP, device)
- Delete account option with data export before deletion

### 1.3 Admin Role Capabilities
- Super Admin can promote/demote users to Admin
- Admins can create sub-categories or course groups
- Multi-admin support with individual audit logs

---

## 2. Admin — Quiz Management

### 2.1 Create Quiz
- **Quiz Title** with rich text description (bold, italic, links)
- **Subject / Category / Tags** for organization and filtering
- **Difficulty Level**: Easy / Medium / Hard / Mixed
- **Quiz Type**:
  - Practice Mode (unlimited attempts, no timer)
  - Exam Mode (strict rules, one attempt)
  - Assignment Mode (deadline-based submission)
  - Live Quiz Mode (all students take it simultaneously)
- **Instructions Panel** — custom instructions shown before the quiz starts
- Draft / Published / Archived status toggle
- Duplicate a quiz to reuse as a template
- Schedule publish date and auto-expiry date

### 2.2 Update Quiz
- Edit any quiz field at any time (changes only apply to future attempts)
- Version history — see previous versions of a quiz
- Rollback to any previous version with one click
- Bulk edit questions (change marks, shuffle options, etc.)

### 2.3 Delete Quiz
- Soft delete (move to trash, restorable for 30 days)
- Permanent delete with confirmation prompt
- Bulk delete multiple quizzes at once
- Archived quizzes remain visible in student history

### 2.4 Quiz Organization
- Create folders / categories to group quizzes
- Drag-and-drop quiz ordering
- Pin important quizzes to the top of the list
- Search and filter quizzes by title, tag, date, status, or difficulty
- Color-label quizzes for quick visual identification

---

## 3. Admin — Question Bank

### 3.1 Question Types
| Type | Description |
|------|-------------|
| **Multiple Choice (Single)** | Pick one correct option from 4–6 choices |
| **Multiple Choice (Multi)** | Pick all correct options (partial marking supported) |
| **True / False** | Simple binary answer |
| **Short Answer** | Free-text input, auto-graded with keywords |
| **Fill in the Blank** | Inline blanks within a sentence |
| **Match the Following** | Drag-and-drop matching pairs |
| **Ordering / Sequence** | Arrange items in correct order |
| **Image-Based** | Question or options contain images |
| **Code Snippet** | Code block display with syntax highlighting |
| **Essay / Long Answer** | Manual grading by admin after submission |

### 3.2 Question Configuration
- **Marks per question** — custom positive marks (e.g., 2, 5, 10)
- **Negative marking** — deduct marks for wrong answers (configurable: -0.25, -0.5, -1)
- **Mandatory questions** — some questions cannot be skipped
- **Hint system** — optional hint that costs partial marks to reveal
- **Explanation field** — shown to students after quiz completion
- **Media attachments** — attach images, diagrams, or audio clips to a question
- **Tags / Topics** — tag each question for filtered analytics
- **Difficulty tag** — per-question difficulty for adaptive quizzes

### 3.3 Question Bank Features
- Central repository of all questions, reusable across multiple quizzes
- Import questions via **CSV / Excel** (bulk upload)
- Export question bank to CSV / PDF
- Search questions by keyword, tag, type, or difficulty
- Duplicate a question for variation
- Archive questions without deleting them

### 3.4 Question Randomization
- Shuffle question order for every student (anti-cheating)
- Shuffle answer options for MCQ questions
- Set a pool (e.g., pick 20 random questions from a bank of 50)
- Ensure every student gets equal difficulty balance when randomizing from pool

---

## 4. Admin — Timer & Rules Engine

### 4.1 Time Limit Configuration
- **Global timer** — entire quiz has a countdown (e.g., 30 minutes for 30 questions)
- **Per-question timer** — each question has its own countdown (e.g., 60 seconds per question)
- **Hybrid timer** — global time + per-question recommended time shown as a guide
- **Visual countdown** — large, color-changing timer (green → yellow → red as time runs out)
- **Audio alerts** — optional beep/ding at 5 minutes and 1 minute remaining

### 4.2 Auto-Submission Rules
- When the timer hits zero, the quiz is **automatically saved and submitted**
- All answered questions are graded; unanswered are marked as 0
- Student receives instant notification: *"Time's up! Your quiz has been submitted."*
- No possibility of submitting after time is up (server-side enforcement)
- Grace period option — admin can add a 30-second buffer before hard cut-off

### 4.3 Attempt Rules
- Set **maximum attempts** per student (1, 2, unlimited)
- **Cooldown period** between attempts (e.g., must wait 24 hours before reattempting)
- Show best score vs. latest score vs. average score for multiple attempts
- Allow students to view previous attempts

### 4.4 Access Control Rules
- **Start window** — quiz is only accessible between specific dates/times
- **Access code / Password** — students need a code to start the quiz
- **Group restriction** — only assign quiz to specific student groups or classes
- **IP restriction** — allow quiz only from specific IP ranges (e.g., campus network)
- **Device restriction** — allow only desktop or only mobile

### 4.5 Submission Rules
- Allow students to **review answers before final submit**
- Enable / disable the ability to **go back** to previous questions
- **Mandatory completion** — prevent submission if unanswered questions remain
- Show warning popup: *"You have 3 unanswered questions. Are you sure?"*

---

## 5. Admin — Analytics & Reporting

### 5.1 Quiz-Level Analytics
- **Total attempts** — how many students took the quiz
- **Completion rate** — percentage who finished vs. dropped off
- **Average score, Highest score, Lowest score**
- **Score distribution chart** — histogram showing how scores spread
- **Average time taken** — how long students spent on the quiz
- **Pass / Fail ratio** with configurable pass mark threshold
- **Drop-off point analysis** — which question most students quit on

### 5.2 Question-Level Analytics
- **Per-question accuracy** — % of students who answered correctly
- **Most selected wrong answer** — reveals common misconceptions
- **Average time per question** — identify which questions students find hardest
- **Skip rate per question** — how often a question was left unanswered
- **Difficulty analysis** — compare admin-set difficulty vs. real-world performance

### 5.3 Student-Level Analytics
- Full result table — student name, score, time taken, attempt number, date
- Sort and filter by score, name, or date
- Click any student to see their detailed answer sheet
- Track improvement across multiple attempts (line graph)
- Flag students scoring below a threshold for follow-up

### 5.4 Reports & Exports
- Export results to **CSV, Excel, PDF**
- Generate a **printable report card** per student
- Bulk export all results for a quiz
- Scheduled reports — auto-email results to admin every week
- Leaderboard export for class sharing

### 5.5 Dashboard Overview (Admin Home)
- Active quizzes count and recent activity
- Total students registered / active this week
- Recent submissions feed (real-time)
- Quick-access card for top-performing and worst-performing quizzes
- Calendar view of upcoming quiz schedules

---

## 6. Admin — Student Management

### 6.1 Student Roster
- View all registered students with profile details
- Filter by group, last active date, or performance range
- Manually add students or bulk import via CSV
- Remove / ban a student from the platform

### 6.2 Groups & Classes
- Create groups (e.g., "Batch A", "Science Class 10")
- Add/remove students from groups
- Assign quizzes to specific groups only
- View group-level average scores and performance trends

### 6.3 Individual Student Management
- View a student's full quiz history
- Reset a student's attempt count to allow retake
- Manually override a student's score (for essay questions)
- Send a direct message or feedback to a student
- Temporarily suspend a student's account

---

## 7. Student — Quiz Experience

### 7.1 Quiz Discovery
- Browse available quizzes filtered by subject, difficulty, or tag
- See quiz details before starting: # of questions, time limit, marks, attempts allowed
- "Coming Soon" quizzes with countdown to unlock date
- Search quizzes by keyword

### 7.2 Pre-Quiz Screen
- Clear display of: time limit, total marks, passing marks, attempt rules
- Read custom instructions from admin
- Enter access code if required
- One-click **Start Quiz** button

### 7.3 During the Quiz
- **Clean, distraction-free UI** — one question per page or all on one scrollable page (admin configurable)
- **Progress bar** showing questions answered vs. total
- **Question navigator panel** — visual grid showing answered (green), unanswered (grey), flagged (yellow)
- **Flag for review** — bookmark questions to revisit before submitting
- **Live countdown timer** prominently displayed (changes color as time reduces)
- **Auto-save** every 30 seconds so progress is not lost on network issues
- Ability to go back to previous questions (if allowed by admin)
- **Reveal hint** button per question (if configured by admin, may cost marks)

### 7.4 Mid-Quiz Protection
- If the student accidentally closes the tab or browser, progress is saved
- On returning, they resume exactly where they left off
- Timer continues running in the background even if tab is closed
- Warning on tab switch (anti-cheating) — see Security section

### 7.5 Submission
- "Submit Quiz" button with confirmation dialog
- Warning if unanswered questions exist
- If timer expires, auto-submit fires server-side (no way to cheat)
- Instant success screen: *"Quiz submitted! Calculating results..."*

---

## 8. Student — Results & Review

### 8.1 Instant Results Screen
- **Score** displayed prominently (e.g., 78/100)
- **Percentage and grade** (A, B, C, D, F — admin configurable scale)
- **Pass / Fail** badge clearly displayed
- **Time taken** for the quiz
- **Rank** among all students who took the same quiz (if enabled)
- Encouraging message for fail, congratulatory for pass

### 8.2 Detailed Answer Review
- Full question-by-question breakdown after submission
- For each question:
  - The question text and all options
  - **Student's selected answer** (highlighted in blue)
  - **Correct answer** (highlighted in green)
  - ❌ Wrong indicator if student got it wrong
  - ✅ Correct indicator if student got it right
  - **Marks earned vs. total marks** per question
  - **Explanation / Solution** (if admin added one)
  - Time spent on this question
- Filter review by: All / Correct / Incorrect / Skipped / Flagged

### 8.3 Score Breakdown
- Visual pie/bar chart showing correct, wrong, and skipped
- Marks earned, marks lost to negative marking, and marks for unattempted
- Topic-wise performance breakdown (if questions are tagged by topic)
- Comparison with class average on each topic

### 8.4 Attempt History
- List of all previous attempts for a quiz with date, score, and time
- Compare performance across attempts with a trend line graph
- Download a personal result PDF / report card

---

## 9. Student — Dashboard & Progress

### 9.1 Student Home Dashboard
- **Upcoming quizzes** with deadlines and time remaining
- **Recent activity feed** — quizzes taken, scores achieved
- **Stats at a glance**: total quizzes taken, average score, best score, pass rate
- **Quick Resume** — continue any quiz in progress

### 9.2 Performance Tracking
- Overall progress graph over time (week/month/all-time)
- Subject-wise performance breakdown
- Streak tracker — how many days in a row the student has practiced
- Personal best score per quiz
- Badges and achievements unlocked (see Gamification below)

### 9.3 Gamification & Motivation
- **Badges** for milestones: First Quiz, Perfect Score, 10 Quizzes Completed, Fastest Finisher, etc.
- **Points system** — earn XP for every quiz taken and passed
- **Leaderboard** — global or group-level, weekly or all-time
- **Streaks** — daily quiz streak with visual flame indicator
- **Level progression** — Beginner → Intermediate → Advanced → Expert based on XP

### 9.4 Notifications for Students
- Email alert when a new quiz is assigned
- Reminder 1 hour before a quiz expires
- Score notification immediately after auto-submission
- Weekly performance summary email

---

## 10. Notifications & Communication

### 10.1 In-App Notifications
- Bell icon with unread count badge
- Notification types: new quiz assigned, quiz result ready, quiz expiring soon, admin message
- Mark as read / Mark all as read
- Notification preferences — choose which alerts to receive

### 10.2 Email Notifications
- Welcome email on registration
- Quiz assignment email with direct link and deadline
- Result email with score summary
- Password reset email
- Admin: weekly summary of platform activity

### 10.3 Admin Announcements
- Admin can send a broadcast message to all students or a specific group
- Rich text announcements with formatting and links
- Pin announcements to student dashboards

---

## 11. Security & Anti-Cheating

### 11.1 Randomization (Primary Defense)
- Questions served in random order per student
- MCQ options shuffled per student
- Questions randomly picked from a larger pool

### 11.2 Browser Behavior Monitoring
- **Tab switch detection** — log every time the student switches tabs
- After N tab switches (configurable), display a serious warning
- After a threshold, optionally auto-submit the quiz
- **Full-screen enforcement** — optionally require students to stay in full-screen mode
- Exiting full-screen triggers a warning and logs the event

### 11.3 Server-Side Security
- All answers submitted and validated server-side (no client-side score calculation)
- Timer enforced on the server — submitting after time limit is rejected
- Rate limiting on answer submission endpoints
- Attempt count enforced server-side — no way to bypass via browser

### 11.4 Audit Logs (Admin)
- Per-attempt log: when started, when each question was answered, time per question, tab switches
- Suspicious activity flags on the results page (e.g., "⚠️ 5 tab switches detected")
- Admin can review and choose to invalidate a result based on the log

### 11.5 Access Security
- HTTPS enforced for all traffic
- Secure, HttpOnly cookies for session tokens
- CSRF protection on all form submissions
- Input sanitization to prevent XSS and SQL injection
- Regular security audits and dependency vulnerability checks

---

## 12. System & Technical Features

### 12.1 Responsive Design
- Fully functional on **Desktop, Tablet, and Mobile** browsers
- Touch-friendly controls for mobile quiz-taking
- Adaptive layout — single column on mobile, multi-column on desktop

### 12.2 Accessibility
- WCAG 2.1 AA compliant
- Screen reader support (ARIA labels on all interactive elements)
- Keyboard navigation for entire quiz flow
- High contrast mode toggle
- Adjustable font size preference

### 12.3 Performance
- Lazy loading of quiz questions (load in batches)
- Optimistic UI updates for smooth experience
- Offline support — if internet drops mid-quiz, answers are cached locally and synced when reconnected
- CDN-hosted assets for fast global load times

### 12.4 Admin Configuration Panel
- Set platform name, logo, and color theme (white-labeling)
- Configure global pass marks percentage
- Set default negative marking rules
- Enable/disable features platform-wide (gamification, leaderboard, hints)
- Manage email templates for notifications
- Set data retention policy (how long result data is stored)

### 12.5 Data & Privacy
- GDPR-compliant data handling
- Students can request a full export of their data
- Students can request account deletion
- Data anonymization for analytics (no PII in aggregate reports)
- Admin-controlled data purge for old quizzes and results

### 12.6 Integrations (Future-Ready)
- **LMS Integration** — export results to Google Classroom, Moodle
- **Webhook support** — push result events to external systems
- **REST API** — documented API for third-party integrations
- **SSO support** — Single Sign-On via SAML/OAuth for institutions
- **Zoom/Meet integration** — for Live Quiz Mode proctoring

---

## 🗂️ Role Summary Table

| Feature | Admin | Student |
|---------|:-----:|:-------:|
| Create / Edit / Delete Quiz | ✅ | ❌ |
| Manage Question Bank | ✅ | ❌ |
| Set Timer & Rules | ✅ | ❌ |
| View All Students' Results | ✅ | ❌ |
| View Analytics & Reports | ✅ | ❌ |
| Manage Student Groups | ✅ | ❌ |
| Override / Manually Grade | ✅ | ❌ |
| Take a Quiz | ❌ | ✅ |
| View Own Results | ❌ | ✅ |
| Review Correct Answers | ❌ | ✅ |
| Track Personal Progress | ❌ | ✅ |
| View Leaderboard | ✅ | ✅ |
| Receive Notifications | ✅ | ✅ |
| Manage Own Profile | ✅ | ✅ |

---

## 🗄️ Database Schema — PostgreSQL (Spring Boot)

> **Conventions used:**
> - Primary keys: `BIGSERIAL` for most tables, `UUID` for tokens/sessions
> - All timestamps: `TIMESTAMPTZ` (timezone-aware)
> - Soft deletes: `deleted_at TIMESTAMPTZ NULL` (NULL = active, non-NULL = deleted)
> - Enums defined as PostgreSQL `TYPE` for type safety
> - Foreign keys named `<referenced_table>_id`
> - Junction/join tables named `<table_a>_<table_b>`

---

### 📌 ENUMs

```sql
-- User role
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'STUDENT');

-- Quiz lifecycle status
CREATE TYPE quiz_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'DELETED');

-- Quiz type / mode
CREATE TYPE quiz_type AS ENUM ('PRACTICE', 'EXAM', 'ASSIGNMENT', 'LIVE');

-- Difficulty level (used for both quiz and question)
CREATE TYPE difficulty_level AS ENUM ('EASY', 'MEDIUM', 'HARD', 'MIXED');

-- Question types
CREATE TYPE question_type AS ENUM (
    'MCQ_SINGLE',
    'MCQ_MULTI',
    'TRUE_FALSE',
    'SHORT_ANSWER',
    'FILL_IN_THE_BLANK',
    'MATCH_THE_FOLLOWING',
    'ORDERING',
    'IMAGE_BASED',
    'CODE_SNIPPET',
    'ESSAY'
);

-- Attempt status
CREATE TYPE attempt_status AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'INVALIDATED');

-- Notification type
CREATE TYPE notification_type AS ENUM (
    'QUIZ_ASSIGNED',
    'QUIZ_EXPIRING',
    'QUIZ_RESULT_READY',
    'ADMIN_MESSAGE',
    'ANNOUNCEMENT',
    'ATTEMPT_RESET'
);

-- Timer mode
CREATE TYPE timer_mode AS ENUM ('GLOBAL', 'PER_QUESTION', 'HYBRID', 'NONE');
```

---

### 👤 Table: `users`

Stores all users — admins and students share this table, role differentiates them.

```sql
CREATE TABLE users (
    id                  BIGSERIAL       PRIMARY KEY,
    uuid                UUID            NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    email               VARCHAR(255)    NOT NULL UNIQUE,
    password_hash       VARCHAR(255),                        -- NULL for OAuth-only users
    full_name           VARCHAR(150)    NOT NULL,
    display_name        VARCHAR(100),
    profile_picture_url TEXT,
    bio                 TEXT,
    role                user_role       NOT NULL DEFAULT 'STUDENT',
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    is_email_verified   BOOLEAN         NOT NULL DEFAULT FALSE,
    xp_points           INTEGER         NOT NULL DEFAULT 0,
    streak_days         INTEGER         NOT NULL DEFAULT 0,
    last_streak_date    DATE,
    last_login_at       TIMESTAMPTZ,
    last_login_ip       INET,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ                          -- soft delete
);

CREATE INDEX idx_users_email       ON users (email);
CREATE INDEX idx_users_role        ON users (role);
CREATE INDEX idx_users_deleted_at  ON users (deleted_at) WHERE deleted_at IS NULL;
```

---

### 🔐 Table: `oauth_providers`

Links a user to their OAuth accounts (Google, GitHub).

```sql
CREATE TABLE oauth_providers (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider        VARCHAR(50)     NOT NULL,               -- 'GOOGLE', 'GITHUB'
    provider_uid    VARCHAR(255)    NOT NULL,               -- provider's user ID
    access_token    TEXT,
    refresh_token   TEXT,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_uid)
);

CREATE INDEX idx_oauth_user_id ON oauth_providers (user_id);
```

---

### 🔑 Table: `refresh_tokens`

JWT refresh tokens for persistent sessions.

```sql
CREATE TABLE refresh_tokens (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255)    NOT NULL UNIQUE,        -- SHA-256 hash of the token
    device_info     TEXT,                                   -- browser/OS string
    ip_address      INET,
    expires_at      TIMESTAMPTZ     NOT NULL,
    revoked_at      TIMESTAMPTZ,                            -- NULL = valid
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id    ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
```

---

### 🔒 Table: `password_reset_tokens`

One-time tokens for forgot password flow.

```sql
CREATE TABLE password_reset_tokens (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255)    NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ     NOT NULL,
    used_at     TIMESTAMPTZ,                                -- NULL = unused
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
```

---

### 📂 Table: `categories`

Hierarchical categories for organizing quizzes (supports sub-categories).

```sql
CREATE TABLE categories (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    slug            VARCHAR(120)    NOT NULL UNIQUE,
    description     TEXT,
    parent_id       BIGINT          REFERENCES categories(id) ON DELETE SET NULL,
    icon_url        TEXT,
    color_hex       CHAR(7),                                -- e.g., '#4F46E5'
    display_order   INTEGER         NOT NULL DEFAULT 0,
    created_by      BIGINT          NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_categories_parent_id ON categories (parent_id);
CREATE INDEX idx_categories_slug      ON categories (slug);
```

---

### 📝 Table: `quizzes`

Core quiz configuration.

```sql
CREATE TABLE quizzes (
    id                      BIGSERIAL           PRIMARY KEY,
    uuid                    UUID                NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    title                   VARCHAR(255)        NOT NULL,
    description             TEXT,                           -- rich text (HTML/Markdown)
    instructions            TEXT,                           -- shown to student before start
    category_id             BIGINT              REFERENCES categories(id) ON DELETE SET NULL,
    created_by              BIGINT              NOT NULL REFERENCES users(id),
    status                  quiz_status         NOT NULL DEFAULT 'DRAFT',
    quiz_type               quiz_type           NOT NULL DEFAULT 'EXAM',
    difficulty              difficulty_level    NOT NULL DEFAULT 'MEDIUM',

    -- Timer configuration
    timer_mode              timer_mode          NOT NULL DEFAULT 'GLOBAL',
    time_limit_seconds      INTEGER,                        -- global timer in seconds
    per_question_seconds    INTEGER,                        -- per-question timer
    grace_period_seconds    INTEGER             NOT NULL DEFAULT 0,

    -- Scoring configuration
    total_marks             NUMERIC(8,2)        NOT NULL DEFAULT 0,
    pass_marks              NUMERIC(8,2)        NOT NULL DEFAULT 0,  -- absolute marks to pass
    negative_marking_factor NUMERIC(4,2)        NOT NULL DEFAULT 0,  -- 0 = no negative, 0.25 = quarter

    -- Attempt rules
    max_attempts            INTEGER             NOT NULL DEFAULT 1,   -- 0 = unlimited
    cooldown_hours          INTEGER             NOT NULL DEFAULT 0,

    -- Access control
    access_code             VARCHAR(50),                    -- NULL = open access
    starts_at               TIMESTAMPTZ,                    -- quiz unlock time
    expires_at              TIMESTAMPTZ,                    -- quiz expiry time
    allowed_ip_range        INET[],                         -- array of allowed IP ranges

    -- Question pool
    question_pool_size      INTEGER,                        -- total Qs in pool
    questions_to_serve      INTEGER,                        -- how many to pick from pool
    shuffle_questions       BOOLEAN             NOT NULL DEFAULT TRUE,
    shuffle_options         BOOLEAN             NOT NULL DEFAULT TRUE,
    allow_back_navigation   BOOLEAN             NOT NULL DEFAULT TRUE,
    show_result_immediately BOOLEAN             NOT NULL DEFAULT TRUE,
    show_correct_answers    BOOLEAN             NOT NULL DEFAULT TRUE,
    show_leaderboard        BOOLEAN             NOT NULL DEFAULT TRUE,

    -- Display
    color_label             CHAR(7),                        -- '#FF5733'
    is_pinned               BOOLEAN             NOT NULL DEFAULT FALSE,
    display_order           INTEGER             NOT NULL DEFAULT 0,
    version                 INTEGER             NOT NULL DEFAULT 1,

    created_at              TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ
);

CREATE INDEX idx_quizzes_category_id  ON quizzes (category_id);
CREATE INDEX idx_quizzes_created_by   ON quizzes (created_by);
CREATE INDEX idx_quizzes_status       ON quizzes (status);
CREATE INDEX idx_quizzes_starts_at    ON quizzes (starts_at);
CREATE INDEX idx_quizzes_expires_at   ON quizzes (expires_at);
CREATE INDEX idx_quizzes_deleted_at   ON quizzes (deleted_at) WHERE deleted_at IS NULL;
```

---

### 📜 Table: `quiz_versions`

Snapshot of quiz config on every save — enables rollback.

```sql
CREATE TABLE quiz_versions (
    id              BIGSERIAL       PRIMARY KEY,
    quiz_id         BIGINT          NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    version         INTEGER         NOT NULL,
    snapshot        JSONB           NOT NULL,               -- full quiz state at that version
    changed_by      BIGINT          NOT NULL REFERENCES users(id),
    change_note     VARCHAR(255),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (quiz_id, version)
);

CREATE INDEX idx_quiz_versions_quiz_id ON quiz_versions (quiz_id);
```

---

### 🏷️ Table: `tags`

Reusable tags shared across quizzes and questions.

```sql
CREATE TABLE tags (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(80)     NOT NULL UNIQUE,
    slug        VARCHAR(90)     NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
```

---

### 🔗 Table: `quiz_tags`

Many-to-many: quiz ↔ tags.

```sql
CREATE TABLE quiz_tags (
    quiz_id     BIGINT  NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    tag_id      BIGINT  NOT NULL REFERENCES tags(id)    ON DELETE CASCADE,
    PRIMARY KEY (quiz_id, tag_id)
);
```

---

### ❓ Table: `questions`

Central question bank — questions exist independently and can be linked to many quizzes.

```sql
CREATE TABLE questions (
    id                  BIGSERIAL           PRIMARY KEY,
    uuid                UUID                NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    question_text       TEXT                NOT NULL,
    question_type       question_type       NOT NULL,
    difficulty          difficulty_level    NOT NULL DEFAULT 'MEDIUM',
    default_marks       NUMERIC(6,2)        NOT NULL DEFAULT 1,
    negative_marks      NUMERIC(6,2)        NOT NULL DEFAULT 0,
    explanation         TEXT,                               -- shown after quiz
    hint_text           TEXT,
    hint_mark_deduction NUMERIC(4,2)        NOT NULL DEFAULT 0,
    media_url           TEXT,                               -- image/audio for the question
    media_type          VARCHAR(20),                        -- 'IMAGE', 'AUDIO', 'VIDEO'
    code_language       VARCHAR(40),                        -- for CODE_SNIPPET type
    is_mandatory        BOOLEAN             NOT NULL DEFAULT FALSE,
    is_archived         BOOLEAN             NOT NULL DEFAULT FALSE,
    created_by          BIGINT              NOT NULL REFERENCES users(id),
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_questions_created_by  ON questions (created_by);
CREATE INDEX idx_questions_type        ON questions (question_type);
CREATE INDEX idx_questions_difficulty  ON questions (difficulty);
CREATE INDEX idx_questions_deleted_at  ON questions (deleted_at) WHERE deleted_at IS NULL;
```

---

### 🅰️ Table: `question_options`

Answer options for MCQ, True/False, Match, Ordering questions.

```sql
CREATE TABLE question_options (
    id              BIGSERIAL       PRIMARY KEY,
    question_id     BIGINT          NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text     TEXT            NOT NULL,
    option_order    INTEGER         NOT NULL DEFAULT 0,
    is_correct      BOOLEAN         NOT NULL DEFAULT FALSE,
    media_url       TEXT,                                   -- image option
    match_pair_key  VARCHAR(255),                           -- for MATCH_THE_FOLLOWING (left side key)
    match_pair_val  VARCHAR(255),                           -- for MATCH_THE_FOLLOWING (right side value)
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_question_options_question_id ON question_options (question_id);
```

---

### 🔗 Table: `question_tags`

Many-to-many: question ↔ tags.

```sql
CREATE TABLE question_tags (
    question_id     BIGINT  NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    tag_id          BIGINT  NOT NULL REFERENCES tags(id)      ON DELETE CASCADE,
    PRIMARY KEY (question_id, tag_id)
);
```

---

### 🔗 Table: `quiz_questions`

Links questions to a specific quiz — configures per-quiz marks and order.

```sql
CREATE TABLE quiz_questions (
    id                  BIGSERIAL       PRIMARY KEY,
    quiz_id             BIGINT          NOT NULL REFERENCES quizzes(id)    ON DELETE CASCADE,
    question_id         BIGINT          NOT NULL REFERENCES questions(id)  ON DELETE RESTRICT,
    display_order       INTEGER         NOT NULL DEFAULT 0,
    marks               NUMERIC(6,2)    NOT NULL,           -- overrides question default_marks for this quiz
    negative_marks      NUMERIC(6,2)    NOT NULL DEFAULT 0,
    per_question_secs   INTEGER,                            -- override global per-question timer for this Q
    is_in_pool          BOOLEAN         NOT NULL DEFAULT TRUE,  -- FALSE = always included (not randomized out)
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (quiz_id, question_id)
);

CREATE INDEX idx_quiz_questions_quiz_id     ON quiz_questions (quiz_id);
CREATE INDEX idx_quiz_questions_question_id ON quiz_questions (question_id);
```

---

### 👥 Table: `student_groups`

Classes or batches that students are organized into.

```sql
CREATE TABLE student_groups (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(150)    NOT NULL,
    description     TEXT,
    created_by      BIGINT          NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);
```

---

### 🔗 Table: `student_group_members`

Many-to-many: students ↔ groups.

```sql
CREATE TABLE student_group_members (
    group_id    BIGINT      NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
    user_id     BIGINT      NOT NULL REFERENCES users(id)          ON DELETE CASCADE,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

CREATE INDEX idx_sgm_user_id  ON student_group_members (user_id);
CREATE INDEX idx_sgm_group_id ON student_group_members (group_id);
```

---

### 🔗 Table: `quiz_group_assignments`

Restricts a quiz to specific groups. If no rows exist → quiz is open to all.

```sql
CREATE TABLE quiz_group_assignments (
    quiz_id     BIGINT      NOT NULL REFERENCES quizzes(id)       ON DELETE CASCADE,
    group_id    BIGINT      NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by BIGINT      NOT NULL REFERENCES users(id),
    PRIMARY KEY (quiz_id, group_id)
);
```

---

### 📋 Table: `quiz_attempts`

Each time a student starts a quiz, a row is created here.

```sql
CREATE TABLE quiz_attempts (
    id                      BIGSERIAL       PRIMARY KEY,
    uuid                    UUID            NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    quiz_id                 BIGINT          NOT NULL REFERENCES quizzes(id) ON DELETE RESTRICT,
    student_id              BIGINT          NOT NULL REFERENCES users(id)   ON DELETE RESTRICT,
    attempt_number          INTEGER         NOT NULL DEFAULT 1,
    status                  attempt_status  NOT NULL DEFAULT 'IN_PROGRESS',

    -- Timing
    started_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    submitted_at            TIMESTAMPTZ,
    deadline_at             TIMESTAMPTZ     NOT NULL,               -- server-calculated: started_at + time_limit

    -- Scoring
    total_marks_possible    NUMERIC(8,2)    NOT NULL DEFAULT 0,
    marks_obtained          NUMERIC(8,2)    NOT NULL DEFAULT 0,
    positive_marks          NUMERIC(8,2)    NOT NULL DEFAULT 0,
    negative_marks_deducted NUMERIC(8,2)    NOT NULL DEFAULT 0,
    percentage              NUMERIC(5,2),
    is_passed               BOOLEAN,
    rank                    INTEGER,                                -- rank among all attempts for this quiz

    -- Anti-cheat summary
    tab_switch_count        INTEGER         NOT NULL DEFAULT 0,
    fullscreen_exit_count   INTEGER         NOT NULL DEFAULT 0,
    is_flagged_suspicious   BOOLEAN         NOT NULL DEFAULT FALSE,
    invalidation_reason     TEXT,

    -- Question order served (stored as ordered array of quiz_question ids)
    question_order          BIGINT[]        NOT NULL DEFAULT '{}',

    ip_address              INET,
    user_agent              TEXT,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_attempts_quiz_id      ON quiz_attempts (quiz_id);
CREATE INDEX idx_quiz_attempts_student_id   ON quiz_attempts (student_id);
CREATE INDEX idx_quiz_attempts_status       ON quiz_attempts (status);
CREATE INDEX idx_quiz_attempts_submitted_at ON quiz_attempts (submitted_at);
-- Enforce attempt numbering and cooldown logic in application layer
```

---

### ✍️ Table: `attempt_answers`

Each answer a student gives within an attempt.

```sql
CREATE TABLE attempt_answers (
    id                  BIGSERIAL       PRIMARY KEY,
    attempt_id          BIGINT          NOT NULL REFERENCES quiz_attempts(id)  ON DELETE CASCADE,
    quiz_question_id    BIGINT          NOT NULL REFERENCES quiz_questions(id) ON DELETE RESTRICT,
    question_id         BIGINT          NOT NULL REFERENCES questions(id)      ON DELETE RESTRICT,

    -- Student's response (flexible to support all question types)
    selected_option_ids BIGINT[],                           -- MCQ single/multi: array of question_option ids
    text_answer         TEXT,                               -- SHORT_ANSWER, FILL_BLANK, ESSAY
    ordered_option_ids  BIGINT[],                           -- ORDERING: option ids in student's order
    match_pairs         JSONB,                              -- MATCH: {"option_id": "matched_option_id"}
    boolean_answer      BOOLEAN,                            -- TRUE_FALSE

    -- Hint
    hint_used           BOOLEAN         NOT NULL DEFAULT FALSE,

    -- Grading
    is_correct          BOOLEAN,                            -- NULL for essays (manually graded)
    is_skipped          BOOLEAN         NOT NULL DEFAULT FALSE,
    marks_awarded       NUMERIC(6,2)    NOT NULL DEFAULT 0,
    is_flagged          BOOLEAN         NOT NULL DEFAULT FALSE,  -- student flagged for review
    manual_grade_note   TEXT,                               -- admin note for essay grading
    graded_by           BIGINT          REFERENCES users(id),
    graded_at           TIMESTAMPTZ,

    -- Timing
    time_spent_seconds  INTEGER         NOT NULL DEFAULT 0,
    answered_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_id, quiz_question_id)
);

CREATE INDEX idx_attempt_answers_attempt_id       ON attempt_answers (attempt_id);
CREATE INDEX idx_attempt_answers_quiz_question_id ON attempt_answers (quiz_question_id);
```

---

### 🕵️ Table: `attempt_audit_logs`

Granular event log for anti-cheat analysis.

```sql
CREATE TABLE attempt_audit_logs (
    id          BIGSERIAL       PRIMARY KEY,
    attempt_id  BIGINT          NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    event_type  VARCHAR(60)     NOT NULL,                   -- 'TAB_SWITCH', 'FULLSCREEN_EXIT', 'PASTE', 'BLUR', 'FOCUS', 'AUTO_SAVE', 'HINT_REVEALED'
    event_data  JSONB,                                      -- extra context (e.g., question_id at time of event)
    occurred_at TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_attempt_id  ON attempt_audit_logs (attempt_id);
CREATE INDEX idx_audit_logs_event_type  ON attempt_audit_logs (event_type);
CREATE INDEX idx_audit_logs_occurred_at ON attempt_audit_logs (occurred_at);
```

---

### 🔔 Table: `notifications`

In-app notification inbox per user.

```sql
CREATE TABLE notifications (
    id              BIGSERIAL           PRIMARY KEY,
    user_id         BIGINT              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            notification_type   NOT NULL,
    title           VARCHAR(255)        NOT NULL,
    message         TEXT                NOT NULL,
    action_url      TEXT,                                   -- deep link (e.g., /quiz/123)
    is_read         BOOLEAN             NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    reference_id    BIGINT,                                 -- e.g., quiz_id or attempt_id
    reference_type  VARCHAR(50),                            -- 'QUIZ', 'ATTEMPT', 'ANNOUNCEMENT'
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id    ON notifications (user_id);
CREATE INDEX idx_notifications_is_read    ON notifications (is_read);
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);
```

---

### 📢 Table: `announcements`

Admin broadcast messages pinned to student dashboards.

```sql
CREATE TABLE announcements (
    id              BIGSERIAL       PRIMARY KEY,
    title           VARCHAR(255)    NOT NULL,
    content         TEXT            NOT NULL,               -- rich text
    created_by      BIGINT          NOT NULL REFERENCES users(id),
    is_pinned       BOOLEAN         NOT NULL DEFAULT FALSE,
    target_all      BOOLEAN         NOT NULL DEFAULT TRUE,  -- FALSE = target specific groups
    published_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- When target_all = FALSE, specific groups are listed here
CREATE TABLE announcement_groups (
    announcement_id BIGINT  NOT NULL REFERENCES announcements(id)    ON DELETE CASCADE,
    group_id        BIGINT  NOT NULL REFERENCES student_groups(id)   ON DELETE CASCADE,
    PRIMARY KEY (announcement_id, group_id)
);
```

---

### 🏆 Table: `badges`

Badge definitions (admin configures these).

```sql
CREATE TABLE badges (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL UNIQUE,
    description     TEXT,
    icon_url        TEXT,
    condition_type  VARCHAR(80)     NOT NULL,               -- 'FIRST_QUIZ', 'PERFECT_SCORE', 'STREAK_7', 'XP_1000', etc.
    condition_value INTEGER         NOT NULL DEFAULT 0,     -- threshold (e.g., 7 for streak, 1000 for XP)
    xp_reward       INTEGER         NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
```

---

### 🔗 Table: `student_badges`

Badges earned by students.

```sql
CREATE TABLE student_badges (
    id          BIGSERIAL   PRIMARY KEY,
    student_id  BIGINT      NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    badge_id    BIGINT      NOT NULL REFERENCES badges(id)  ON DELETE CASCADE,
    earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, badge_id)
);

CREATE INDEX idx_student_badges_student_id ON student_badges (student_id);
```

---

### 🥇 Table: `leaderboard_snapshots`

Periodic snapshot of leaderboard rankings (avoid expensive real-time computation).

```sql
CREATE TABLE leaderboard_snapshots (
    id              BIGSERIAL   PRIMARY KEY,
    scope           VARCHAR(20) NOT NULL,                   -- 'GLOBAL', 'GROUP', 'QUIZ'
    scope_id        BIGINT,                                 -- group_id or quiz_id (NULL for global)
    period          VARCHAR(20) NOT NULL,                   -- 'WEEKLY', 'MONTHLY', 'ALL_TIME'
    student_id      BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rank            INTEGER     NOT NULL,
    total_xp        INTEGER     NOT NULL DEFAULT 0,
    quizzes_taken   INTEGER     NOT NULL DEFAULT 0,
    avg_score       NUMERIC(5,2),
    snapshot_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leaderboard_scope_period ON leaderboard_snapshots (scope, scope_id, period, snapshot_date);
CREATE INDEX idx_leaderboard_student_id   ON leaderboard_snapshots (student_id);
```

---

### ⚙️ Table: `platform_settings`

Key-value store for global admin configuration.

```sql
CREATE TABLE platform_settings (
    key             VARCHAR(100)    PRIMARY KEY,
    value           TEXT            NOT NULL,
    value_type      VARCHAR(20)     NOT NULL DEFAULT 'STRING', -- 'STRING', 'INTEGER', 'BOOLEAN', 'JSON'
    description     TEXT,
    updated_by      BIGINT          REFERENCES users(id),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Seed default values
INSERT INTO platform_settings (key, value, value_type, description) VALUES
    ('platform_name',              'QuizMaster Pro',   'STRING',  'Platform display name'),
    ('platform_logo_url',          '',                 'STRING',  'Logo URL'),
    ('default_pass_percentage',    '40',               'INTEGER', 'Default passing percentage'),
    ('gamification_enabled',       'true',             'BOOLEAN', 'Enable badges, XP, leaderboard'),
    ('leaderboard_enabled',        'true',             'BOOLEAN', 'Show leaderboard to students'),
    ('hints_enabled',              'true',             'BOOLEAN', 'Allow hints in quizzes'),
    ('data_retention_days',        '365',              'INTEGER', 'Days to retain result data'),
    ('max_tab_switches_allowed',   '3',                'INTEGER', 'Tab switches before auto-submit'),
    ('fullscreen_enforcement',     'false',            'BOOLEAN', 'Force fullscreen during quiz');
```

---

### 📊 Useful Views

Pre-built views to simplify Spring Boot repository queries.

```sql
-- Quiz result summary per attempt
CREATE VIEW vw_attempt_summary AS
SELECT
    qa.id                   AS attempt_id,
    qa.uuid                 AS attempt_uuid,
    qa.quiz_id,
    q.title                 AS quiz_title,
    qa.student_id,
    u.full_name             AS student_name,
    u.email                 AS student_email,
    qa.attempt_number,
    qa.status,
    qa.started_at,
    qa.submitted_at,
    qa.marks_obtained,
    qa.total_marks_possible,
    qa.percentage,
    qa.is_passed,
    qa.rank,
    qa.tab_switch_count,
    qa.is_flagged_suspicious,
    EXTRACT(EPOCH FROM (qa.submitted_at - qa.started_at))::INTEGER AS duration_seconds
FROM quiz_attempts qa
JOIN quizzes  q ON q.id = qa.quiz_id
JOIN users    u ON u.id = qa.student_id;

-- Per-question accuracy across all attempts for a quiz
CREATE VIEW vw_question_accuracy AS
SELECT
    qq.quiz_id,
    aa.question_id,
    COUNT(*)                                            AS total_answers,
    COUNT(*) FILTER (WHERE aa.is_correct = TRUE)       AS correct_count,
    COUNT(*) FILTER (WHERE aa.is_skipped = TRUE)       AS skipped_count,
    COUNT(*) FILTER (WHERE aa.hint_used  = TRUE)       AS hint_used_count,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE aa.is_correct = TRUE) / NULLIF(COUNT(*), 0), 2
    )                                                   AS accuracy_pct,
    AVG(aa.time_spent_seconds)                         AS avg_time_seconds
FROM attempt_answers aa
JOIN quiz_questions  qq ON qq.id = aa.quiz_question_id
GROUP BY qq.quiz_id, aa.question_id;
```

---

### 🗺️ Entity Relationship Overview

```
users ──────────────────────── quiz_attempts ─────────── attempt_answers
  │                                   │                          │
  │ (created_by)                      │                          │
  ▼                              quiz_questions ────────── questions ──── question_options
quizzes ──── quiz_questions           │                          │
  │                             (quiz_id)                  question_tags
  ├── quiz_tags ──── tags                                        │
  ├── quiz_versions                                            tags
  ├── quiz_group_assignments ─── student_groups ─── student_group_members
  └── categories (self-ref)
                                                 attempt_audit_logs ──── quiz_attempts
users ──── student_badges ──── badges
users ──── notifications
users ──── oauth_providers
users ──── refresh_tokens
```

---

### 🌱 Spring Boot Entity Notes

| Spring Boot Concept | Recommendation |
|---|---|
| Primary Key Strategy | `@GeneratedValue(strategy = GenerationType.IDENTITY)` for BIGSERIAL |
| UUID fields | `@Column(columnDefinition = "uuid", updatable = false)` |
| Enum mapping | `@Enumerated(EnumType.STRING)` (matches PostgreSQL ENUM names) |
| Soft delete | Use `@Where(clause = "deleted_at IS NULL")` on entity |
| Timestamps | `@CreationTimestamp` / `@UpdateTimestamp` from Hibernate |
| JSON columns | `@JdbcTypeCode(SqlTypes.JSON)` with Hibernate 6+ |
| Array columns (BIGINT[]) | Use `@JdbcTypeCode(SqlTypes.ARRAY)` or store as `TEXT` JSON |
| Auditing | Enable `@EnableJpaAuditing` with `@CreatedBy` / `@LastModifiedBy` |
| Pagination | All list endpoints use `Pageable` with `Page<T>` return type |
| Lazy loading | Default `LAZY` on all `@ManyToOne` / `@OneToMany` |

---

*Document Version: 2.0 | Last Updated: March 2026*  
*This document covers all planned features and the full PostgreSQL database schema for the QuizMaster Pro web application built on Spring Boot.*
