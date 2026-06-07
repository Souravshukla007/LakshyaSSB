# 🎯 LakshyaSSB: AI-Powered Services Selection Board (SSB) Preparation Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.2.0-2D3748?style=flat-square&logo=prisma)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Capacitor JS](https://img.shields.io/badge/Capacitor-6.1.2-119EFF?style=flat-square&logo=capacitor)](https://capacitorjs.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Integrated-blue?style=flat-square)](https://razorpay.com/)
[![Google Gemini API](https://img.shields.io/badge/Google_Gemini-1.5_Flash-orange?style=flat-square&logo=google)](https://ai.google.dev/)

A production-grade, isomorphic EdTech ecosystem designed to help Indian Armed Forces aspirants ace the highly rigorous **Services Selection Board (SSB)** interview process. Built with a unified full-stack architecture, LakshyaSSB simulates psychometric, physical, and cognitive evaluations, scoring candidates using advanced NLP models and providing detailed feedback on Officer Like Qualities (OLQs).

---

## ⚡ Recruiter Fast-Track (30-Second Summary)

If you are a Recruiter, Hiring Manager, or SDE Interviewer looking to evaluate the technical depth of this project, here is what makes this repository stand out immediately:

*   **Isomorphic Monorepo Architecture**: Leverages Next.js server/client component boundaries to deliver blazing-fast page load times, while isolating heavy relational calculations (Prisma) securely to the server side to minimize client JS footprint.
*   **Production-Grade Payment Pipeline**: Employs an ultra-lean Razorpay payment implementation built directly over raw HTTP fetch endpoints, bypassing bulky SDK integrations. Secured via server-side SHA-256 HMAC cryptographic signature comparisons and transaction-level idempotency guards to prevent replay attacks.
*   **Low-Cost Resilient AI Integration**: Combines local regex NLP engines to intercept and evaluate basic signals with Google Gemini API parsing to process detailed qualitative data. Employs advanced backoff retry strategies to provide cost-effective and highly reliable evaluations.
*   **True Hybrid Portability**: Adapted seamlessly into a native Android wrapper using **Capacitor JS**, custom-tailored with WebView overrides to support OAuth Google logins on native shells.

---

## 📂 Direct Code Navigation (Key Implementation Anchors)

Skip the folders and jump straight into the production code implementation of key features:

| Feature | Key Logic File | Role / Purpose |
| :--- | :--- | :--- |
| **🔐 Isomorphic Auth** | [`lib/auth.ts`](./lib/auth.ts) | Custom JWT generation via `jose` inside `httpOnly` rolling cookies. |
| **🧠 Psychological Eval** | [`lib/evaluators/tat-evaluator.ts`](./lib/evaluators/tat-evaluator.ts) | Local NLP keyword evaluation heuristics and story scoring. |
| **🧠 WAT Psych Eval** | [`lib/evaluators/wat-evaluator.ts`](./lib/evaluators/wat-evaluator.ts) | Multi-tier word-difficulty semantic assessment matrices. |
| **💳 Webhook Validation** | [`app/api/payment/verify/route.ts`](./app/api/payment/verify/route.ts) | Secure server-side signature validation and payment capture. |
| **🤖 AI Pipeline** | [`lib/ai-processor.ts`](./lib/ai-processor.ts) | Resilient Gemini 1.5 Flash query templates, JSON enforcement, and retry delays. |
| **📱 Native Setup** | [`capacitor.config.ts`](./capacitor.config.ts) | Webview redirects, splash screens, and user agent overrides. |

---

## 📌 Problem Statement

The **Services Selection Board (SSB)** is a 5-day evaluation procedure that assesses candidates for commissioning into the Indian Army, Navy, and Air Force. With an ultimate recommendation rate of under **10%**, the evaluation is famous for its intensive psychological tests (TAT, WAT, SRT), physical and medical screenings, and the personal interview. 

Aspirants face three key problems:
1. **Lack of Objective Evaluation**: Psychological tests are highly subjective. Traditional coaching academies charge exorbitant fees but rely on generic, non-personalized human reviews.
2. **Access and Pricing Barriers**: High-quality practice materials and simulators are locked behind recurring subscriptions, leaving underprivileged aspirants without resources.
3. **Fragmented Tracking**: Aspirants lack a centralized dashboard to track their psychological progress, daily streaks, physical metrics against official military medical standards, and OIR readiness.

**LakshyaSSB** solves this by providing a unified, AI-enhanced, cost-effective prep platform. It utilizes custom NLP semantic scrapers, static scoring heuristics, and Google Gemini AI to analyze user-generated psychometric responses, evaluate their traits against the 15 standard **Officer Like Qualities (OLQs)**, and provide instant corrective actions.

---

## ✨ Key Features

### 🔐 Authentication
*   **Passwordless Email OTP**: Secure login and signup via a server-generated 6-digit cryptographically random OTP, dispatched via high-deliverability **Resend** REST templates and persisted with a 5-minute database expiry.
*   **Google OAuth Integration**: Native Google sign-in capabilities bridged seamlessly between Next.js web routers and the **Capacitor Google Auth** mobile plugin, resolving agent-block issues natively.

### 🧠 AI Evaluation
*   **PIQ Builder & Analyzer**: Replicates the physical Personal Information Questionnaire (PIQ) form, evaluating leadership, adaptability, and academic consistency inputs to generate a simulated Interviewing Officer (IO) question sheet.
*   **Psychological Test Simulators**:
    *   **Thematic Apperception Test (TAT)**: Evaluates user-written stories based on difficulty multipliers and NLP keywords assessing Hero, Planning, Action, and Realism traits.
    *   **Word Association Test (WAT)**: Evaluates user sentences on positive orientation, action inclination, and responsibility indicators.
    *   **Situation Reaction Test (SRT)**: Analyzes logical actions, speed of response, and decision risk-levels under crisis.
*   **OIR Test & Tracker**: Intelligent, non-repeating Officer Intelligence Rating question engine that logs user history to prevent duplicate question prompts.
*   **Daily SSB Coach Chat**: A persistent, context-aware conversational AI (Gemini 1.5 Flash) trained on SSB officer guidelines to guide aspirants on GTO and interview tasks.

### 💳 Payments & Subscription
*   **Razorpay Integration**: Sleek paywall enabling aspirants to upgrade from **FREE** to **PRO** using UPI, NetBanking, and Cards.
*   **Idempotency & Security**: Fully secured server-to-server HMAC signature verification and double-activation guards to prevent payment replays.

### 📱 Mobile App
*   **Hybrid Mobile Shell**: Native Android shell generated via **Capacitor JS** wrapping the live Next.js application, utilizing customized Android web client configurations to support mixed-content and cross-domain scripts.
*   **Branded Native Shell**: Custom native SplashScreen overlays, spinner configurations, and localized app icons matching our signature branding palette.

### 🎨 User Experience
*   **Gamified Streaks & Medals**: Tracks daily login streaks and awards weekly dynamic medals to boost engagement.
*   **SSB Entry Navigator™**: Physical eligibility calculator mapping age, educational degrees, height, and gender against the official Indian Defence gazette entries.
*   **Leaderboards**: Global competitive ranking dashboards grouped by weekly, overall, and streak metrics.
*   **Medical Readiness Simulator**: Computes BMI, visual acuity scores, and standard muscular fitness indices to construct a 30-day corrective workout calendar.

### 🛡️ Security
*   **HttpOnly Cookies**: Prevents Cross-Site Scripting (XSS) by housing session tokens strictly inside server-signed, non-readable cookies.
*   **Database Cascade Safeguards**: Strict relational schema preventing orphaned data when deleting accounts.
*   **Webhook Verification**: Verifies Razorpay callbacks using SHA-256 HMAC comparisons to prevent spoofing.

---

## 🏗️ System Architecture

LakshyaSSB is built upon an isomorphic, edge-compatible monorepo using Next.js. Here is the architectural pipeline:

```mermaid
graph TD
    User([Candidate / Mobile User]) -->|Interacts| UI[Next.js App / Capacitor WebView]
    
    subgraph Frontend [Client-Side Layer]
        UI -->|Triggers payment| RZP_SDK[Razorpay Checkout SDK]
        UI -->|Native Google Login| CAP_G[Capacitor Google Auth Plugin]
    end

    subgraph API [Next.js Backend API Layer]
        RZP_SDK -->|Verifies payment| VerifyAPI[Verify API /api/payment/verify]
        CAP_G -->|Logs in| GoogleAPI[Google Auth API /api/auth/google]
        UI -->|Submits WAT/TAT/SRT| EvalAPI[Psych Evaluation API /api/wat|tat|srt]
        UI -->|Gets news & updates| AffairAPI[Current Affairs API]
        UI -->|Requests OTP| OtpAPI[OTP API /api/auth/send-otp]
    end

    subgraph Database [Persistence & Cache]
        VerifyAPI -->|Transaction Upgrade| PostgreSQL[(PostgreSQL - Neon)]
        GoogleAPI -->|Persists Profile| PostgreSQL
        EvalAPI -->|Logs attempt & results| PostgreSQL
        AffairAPI -->|Retrieves news| PostgreSQL
        OtpAPI -->|Creates temporary OTP record| PostgreSQL
    end

    subgraph Services [External Integration Services]
        EvalAPI -->|NLP & Prompts| Gemini[Google Gemini AI API]
        OtpAPI -->|Sends transactional email| Resend[Resend Email API]
        VerifyAPI -->|HMAC & capture| Razorpay[Razorpay REST API]
        Cron[Vercel Cron Job] -->|RSS Scrapes Daily News| GNews[GNews API]
        GNews -->|Transform to SSB format| Gemini
        Gemini -->|Save Parsed News| PostgreSQL
    end

    classDef client fill:#FF8C00,stroke:#d35400,stroke-width:2px,color:#fff;
    classDef api fill:#4A90E2,stroke:#2980b9,stroke-width:2px,color:#fff;
    classDef db fill:#2ECC71,stroke:#27ae60,stroke-width:2px,color:#fff;
    classDef ext fill:#9B59B6,stroke:#8e44ad,stroke-width:2px,color:#fff;

    class User,UI,RZP_SDK,CAP_G client;
    class VerifyAPI,GoogleAPI,EvalAPI,AffairAPI,OtpAPI api;
    class PostgreSQL db;
    class Gemini,Resend,Razorpay,Cron,GNews ext;
```

---

## 💻 Tech Stack

| Technology | Category | Usage / Context |
| :--- | :--- | :--- |
| **Next.js 16.2.3** | Frontend & Backend Framework | Isomorphic App Router, Server Components, API Route endpoints |
| **React 19.0.0** | Frontend UI | Component hierarchy, virtual DOM, interactive states |
| **Tailwind CSS 3.4.17** | CSS Styling | Utility-first responsive design, custom glassmorphism systems |
| **TypeScript 5.7.2** | Programming Language | Compile-time type checks and schema interface mappings |
| **PostgreSQL 16** | Relational Database | Neon serverless hosting, ACID transactional storage |
| **Prisma ORM 6.2.0** | Database ORM | Type-safe queries, migration system, relational indices |
| **Capacitor JS 6.1.2** | Mobile Shell | Native Android WebView bridge, system native hardware APIs |
| **Google Gemini API** | Artificial Intelligence | Psych evaluations, news conversion, conversational coach |
| **Razorpay SDK & API** | Payment Processing | Order generation, payment processing, HMAC signature validation |
| **Resend API** | Transactional Mail | Serverless passwordless OTP dispatch |
| **Jose 5.9.6** | Security | Cryptographic JWT signing and cookie decrypts |
| **Bcryptjs 2.4.3** | Security | One-way password hashing algorithms |

---

## 🗃️ Database Design

The relational database is configured to ensure strict relational integrity and rapid queries using Prisma ORM.

```
                  ┌──────────────────────┐
                  │         User         │
                  └──────────┬───────────┘
                             │ (1)
         ┌───────────────────┼─────────────────────┐
         │ (1)               │ (1)                 │ (1)
 ┌───────▼───────┐   ┌───────▼───────┐     ┌───────▼───────┐
 │    Payment    │   │ MedicalResult │     │ PiqSubmission │
 └───────────────┘   └───────────────┘     └───────────────┘
                                                   │ (1)
 ┌───────────────┐   ┌───────────────┐     ┌───────▼───────┐
 │   SrtResult   │   │   WatResult   │     │   PiqScore    │
 └───────▲───────┘   └───────▲───────┘     └───────────────┘
         │ (N)               │ (N)
         ├───────────────────┼─────────────────────┐
         │ (N)               │ (N)                 │ (N)
 ┌───────┴───────┐   ┌───────┴───────┐     ┌───────┴───────┐
 │   TatResult   │   │ChatMessage(AI)│     │PracticeAttempt│
 └───────────────┘   └───────────────┘     └───────────────┘
```

### Key Models Explained:
*   **User**: The primary entity. Houses profiles, credentials, gamification scores (`medals_total`, `medals_weekly`, streaks), and subscription tier state (`plan: Plan` which is either `FREE` or `PRO`).
*   **Payment**: Stores payment tracking info (`razorpayOrderId`, `razorpayPaymentId`, `amount`, and `status: PaymentStatus` enum: `PENDING`, `SUCCESS`, `FAILED`).
*   **MedicalResult**: Stores physical metrics (`heightCm`, `weightKg`, `vision`, `pushups`, etc.) along with computed scores and `riskLevel`.
*   **PiqSubmission & PiqScore**: `PiqSubmission` stores raw profile answers (e.g. NCC involvement, team sports, sports level). `PiqScore` records historic evaluations of OLQ dimensions (leadership, initiative, adaptability, social compliance, etc.).
*   **SrtResult / WatResult / TatResult**: Storing user attempts of situation, word, and apperception tests. Incorporates `themeScores` as flexible JSON schemas to allow scalability as new evaluation metrics are designed.
*   **OirQuestionHistory**: Unique pair `[userId, questionKey]` tracking seen intelligence questions to maintain an optimized, unique user feed.

---

## 🔑 Authentication Flow

LakshyaSSB operates a secure passwordless login standard natively supported on both web and Capacitor shells:

```
[Candidate Email] ────────────────► POST /api/auth/send-otp
                                            │
                                    ┌───────┴───────┐
                                    ▼               ▼
                           [DB: Create OTP]   [Resend Email]
                                                    │
                                            (User Enters OTP)
                                                    │
[Cookie Saved httpOnly] ◄─── Sign Session ◄── POST /api/auth/verify-otp
```

### Security Details:
1.  **Tamper-Proof Encryption**: Sessions are signed via the edge-compatible `jose` library using `HS256` HMAC algorithms.
2.  **Rolling Token Expirations**: Sessions expire after 7 days, refreshed dynamically on every user action using a Next.js middleware handler.
3.  **Strict Cookie Control**: Saved cookies use `httpOnly`, `sameSite: 'lax'`, and are set to `secure: true` in production, blocking client-side JavaScript access to prevent XSS credential theft.

---

## 🤖 AI Pipeline

Subjective evaluations (TAT, WAT, SRT) and Daily News are processed via structured pipelines:

```
User Story Input  ──► Local Keyword Filter (Regex) ──► Prompt Construction 
                                                           │
┌──────────────────────────────────────────────────────────┘
▼
Google Gemini (gemini-1.5-flash) ──► JSON Mode Enforcement ──► DB Schema Insert
```

### Processing Steps:
1.  **Keyword Interception**: Inputs are parsed using specialized keyword dictionaries (e.g. `PLANNING_KEYWORDS`, `LEADERSHIP_KEYWORDS`, `PANIC_WORDS`) to score positive and negative signals locally.
2.  **Prompt Refinement**: Minimal user payloads are injected into specific officer-centric instruction sets to reduce token overhead.
3.  **Structured JSON Mode**: The Gemini API is initialized with `responseMimeType: "application/json"`, forcing the model to respond in highly precise, pre-defined schemas containing OLQ scores, summaries, and action plans.
4.  **Automatic Resiliency & Rate Limiting**: Incorporates recursive retries with exponential backoffs and `429 Too Many Requests` delay estimation parsers, ensuring smooth performance even under extreme usage.

---

## 💳 Payment Architecture

LakshyaSSB features a direct, lightweight server-to-server Razorpay integration using raw fetch requests, eliminating heavy dependencies:

```
Candidate               Frontend UI              Next.js API              Razorpay
   │                         │                        │                       │
   │───[Upgrade Click]──────>│                        │                       │
   │                         │───[POST Order]────────>│                       │
   │                         │                        │───[Fetch API Order]──>│
   │                         │                        │<──[Order Payload]─────│
   │                         │<──[Returns Order ID]───│                       │
   │                         │                                                │
   │───[Opens Checkout UI]──>│                                                │
   │───[Submits Payment]─────────────────────────────────────────────────────>│
   │                         │<──[Returns Payment ID & Signature]─────────────│
   │                         │                                                │
   │                         │───[POST /verify]──────>│                       │
   │                         │                        │───[HMAC Signature]    │
   │                         │                        │    Matches Sig? ✅    │
   │                         │                        │───[Save SUCCESS]      │
   │                         │                        │───[Upgrade PRO]       │
   │                         │<──[Upgrade Complete]───│                       │
   ▼                         ▼                        ▼                       ▼
```

### Signature Verification Logic:
Verification is calculated strictly on the backend to prevent client-side bypasses:
```ts
const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
}
```

---

## 📱 Mobile Application

The mobile experience wraps the responsive web platform using **Capacitor JS**, creating a highly optimized native Android experience.

```
       Capacitor Native Android Container
 ┌─────────────────────────────────────────────┐
 │  ┌───────────────────────────────────────┐  │
 │  │        Web View (Next.js Stream)      │  │
 │  │        https://lakshya-ssb.vercel.app │  │
 │  └───────────────────────────────────────┘  │
 │                      ▲                      │
 │                      │ JS Bridge            │
 │                      ▼                      │
 │  ┌───────────────────────────────────────┐  │
 │  │        Capacitor System Plugins       │  │
 │  │    (GoogleAuth, SplashScreens)        │  │
 │  └───────────────────────────────────────┘  │
 └─────────────────────────────────────────────┘
```

### Capacitor Implementation Strengths:
*   **Disallowed User Agent Bypass**: Overrides default WebView user-agents to prevent `Error 403: disallowed_useragent` errors during Google OAuth inside native WebViews.
*   **Bridge Configuration (`capacitor.config.ts`)**:
    ```ts
    const config: CapacitorConfig = {
      appId: 'in.lakshyassb.app',
      appName: 'Lakshya SSB',
      webDir: 'public',
      server: {
        url: 'https://lakshya-ssb.vercel.app',
        cleartext: true,
        allowNavigation: ["checkout.razorpay.com", "api.razorpay.com", "*"]
      }
    };
    ```

---

## 📂 Project Structure

```text
LakshyaSSB/
├── android/                    # Native Android studio project shell (Capacitor generated)
├── app/                        # Next.js App Router (Universal Pages, Layouts, API endpoints)
│   ├── api/                    # Backend server-side routes
│   │   ├── auth/               # Passwordless OTP, Google OAuth & Session decodes
│   │   │   ├── google/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── send-otp/route.ts
│   │   │   ├── session/route.ts
│   │   │   ├── signup/route.ts
│   │   │   ├── status/route.ts
│   │   │   └── verify-otp/route.ts
│   │   ├── payment/            # Order creation & HMAC validation routes
│   │   ├── tat/                # Subjective TAT story submission APIs
│   │   ├── wat/                # WAT assessment handlers
│   │   └── srt/                # SRT scenario submissions
│   ├── dashboard/              # User primary control panel
│   ├── ssb/                    # 5-Day Day-wise interactive timeline guides
│   ├── ssb-entry-navigator/    # Defence eligibility matrix calculator
│   ├── globals.css             # Main styling, custom Tailwind setups
│   └── page.tsx                # Main Landing Page
├── components/                 # Reusable React UI Elements (Navbar, Streak tracker, Paywall cards)
├── lib/                        # Logic engines & helper scripts
│   ├── evaluators/             # Native regex NLP evaluation engines
│   │   ├── srt-evaluator.ts
│   │   └── tat-evaluator.ts
│   ├── ai-processor.ts       # Core Google Gemini prompt pipeline
│   ├── auth.ts              # JWT signing, cookie management, session validations
│   ├── gnews-fetcher.ts      # GNews API scrapers
│   ├── medals.ts               # Gamified award heuristics
│   └── prisma.ts               # Type-safe database connection instance
├── prisma/                     # Database schema definitions
│   └── schema.prisma           # Prisma PostgreSQL structures
├── public/                     # Static media files, brand logos, vector charts
├── capacitor.config.ts         # Hybrid WebView and bridge parameters
├── package.json                # Project dependencies and deployment scripts
└── tailwind.config.ts          # Color tokens, glassmorphism tokens, and fonts
```

---

## 🛠️ Installation & Setup

Follow these steps to run LakshyaSSB locally:

### 1. Prerequisites
Ensure you have the following installed:
*   Node.js (v18.0.0 or higher)
*   PostgreSQL (Local instance or serverless Neon account)

### 2. Clone Repository
```bash
git clone https://github.com/Souravshukla007/LakshyaSSB.git
cd LakshyaSSB
```

### 3. Install Core Dependencies
```bash
npm install
```

### 4. Database Initialization
Synchronize your local schema with your PostgreSQL instance:
```bash
npx prisma db push
npx prisma generate
```

### 5. Launch Local Dev Server
```bash
npm run dev
```
The application will run locally at [http://localhost:3000](http://localhost:3000).

### 6. Build Android APK
Compile resources and sync native code for Capacitor:
```bash
npm run build
npx cap sync
npx cap open android
```

---

## 📄 Environment Variables

Create a `.env` file in your root folder and set the following keys:

```env
# Database Connections
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"

# Next.js Variables
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID="ca-pub-xxxxxxxxxxxxxx"

# Security (JWT & CRON)
JWT_SECRET="generate-a-long-random-base64-string"
CRON_SECRET="generate-a-secure-cron-reset-string"

# Payment Services
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxx"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxx"

# Third-Party Integrations
RESEND_API_KEY="re_xxxxxxxxxxxxxxxx"
GEMINI_API_KEY="AIzaSyxxxxxxxxxxxxxxxx"
GNEWS_API_KEY="xxxxxxxxxxxxxxxx"

# Google Auth Secrets
GOOGLE_CLIENT_ID="xxxxxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxx"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

---

## 📸 Screenshots Section

Here is a visual overview of the key interfaces:

| Dashboard & Control | Interactive Evaluators |
| :---: | :---: |
| ![Dashboard Mockup](https://via.placeholder.com/600x350/FFF7ED/F97316?text=Dashboard+Overview)<br>User controls, streaks, active target entries, and eligible dynamic boards. | ![TAT Evaluation](https://via.placeholder.com/600x350/F5F5F4/78716C?text=TAT+Evaluator)<br>Image-driven TAT evaluation interface displaying prompt stories and scores. |

| Physical Screening | Premium Paywalls |
| :---: | :---: |
| ![Medical Simulator](https://via.placeholder.com/600x350/F5F5F4/78716C?text=Medical+Screening)<br>Eligibility calculations showing weight adjustments and workout schedules. | ![PRO Pricing Panel](https://via.placeholder.com/600x350/FFF7ED/F97316?text=Upgrade+To+PRO)<br>Paywall page with built-in Razorpay checkout popup interfaces. |

---

## 🔮 Future Improvements

- [ ] **Dual-Use Speech Evaluations**: Implement local audio recordings for the **Lecturette** module, utilizing browser whisper models to calculate filler words and pronunciation metrics.
- [ ] **Realtime Group Discussion Simulators**: Incorporate WebRTC audio rooms with virtual examiners evaluating talking duration, tone, and logical argument values.
- [ ] **Offline Mode (Android)**: Cache practice question databases inside SQLite databases via Capacitor storage plugins to enable seamless offline practice.
- [ ] **Redis Performance Layer**: Implement an Upstash Redis cache layer in front of our database to reduce Neon PostgreSQL query loads for Streaks and Global Leaderboards.

---

## 🎖️ Why This Project Matters (Recruiter Corner)

LakshyaSSB is not just a typical CRUD application; it represents a **complex, edge-optimized full-stack engineering solution** designed to address unique constraints:

1.  **High-Performance Isomorphic Architecture**: Leverages Next.js server/client component boundaries to deliver blazing-fast page load times, while isolating heavy relational calculations (Prisma) securely to the server side to minimize client JS footprint.
2.  **Robust Payment Architecture**: Employs an ultra-lean Payment integration bypassing heavy third-party SDK wrappers. Implements server-side SHA-256 HMAC cryptographic hashing and strict idempotency checks, ensuring secure, production-grade financial transactions.
3.  **Low-Cost Resilient AI Integration**: Combines local regex NLP engines to intercept and evaluate basic signals with Google Gemini API parsing to process detailed qualitative data. Employs advanced backoff retry strategies to provide cost-effective and highly reliable evaluations.
4.  **True Cross-Platform Portability**: Demonstrates strong hybrid app engineering by adapting the web codebase into a native Android wrapper via Capacitor JS. Custom-tailors platform configurations to solve common mobile-web pitfalls like Disallowed User Agents.

---
*Built with 🧡 for Indian Armed Forces Aspirants.*
ants.*
ed Forces Aspirants.*
ed Forces Aspirants.*
