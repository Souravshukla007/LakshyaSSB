# 🎯 LakshyaSSB

![LakshyaSSB Banner](https://via.placeholder.com/1200x400/FFF7ED/F97316?text=LakshyaSSB+-+Your+Gateway+to+the+Uniform)

<img src="./public/LSSB_logo.png" alt="LakshyaSSB Logo" width="200" />

LakshyaSSB is a comprehensive, modern EdTech platform dedicated to helping aspirants prepare for the Indian Armed Forces **Services Selection Board (SSB)** interviews. Built with cutting-edge web technologies, it offers a seamless experience for practicing psychological tests, filling out PIQs, tracking medical readiness, and more.

---

## ✨ Features

- **SSB Entry Navigator™**: Interactive calculator to discover eligible Indian Defence officer entries based on age, education, and physical metrics.
- **PIQ Builder & Analyzer**: A smart form that mimics the actual Personal Information Questionnaire (PIQ) with backend evaluation to generate a readiness score and potential Interviewing Officer (IO) questions.
- **Medical Readiness Simulator**: Calculates BMI, assesses vision, and provides risk-level scores based on army medical standards, generating a 30-day prep plan.
- **Interactive Daily Track (Day 1 - 5)**: Detailed guides, mind maps, and practice tasks for Screening, Psychology, GTO, and Conference days.
- **Leaderboards**: Competitive track records (Overall, Weekly, Streak) to keep aspirants motivated.
- **OTP Passwordless Authentication**: Secure and frictionless login via Email OTP.
- **Premium PRO Plan**: Lifetime one-time payment access to detailed OLQ reports and advanced insights.
- **Android Application**: A fully wrapped Android application wrapper via Capacitor JS.
- **Razorpay Integration**: Ready for premium content and mock interview bookings.

## 🚀 Tech Stack

- **Frontend**: [Next.js 15 (App Router)](https://nextjs.org/) & React
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a custom design system (glassmorphism, modern typography)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (hosted on Neon)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: Custom OTP workflow & NextAuth
- **Emails**: [Resend](https://resend.com/)
- **Payments**: [Razorpay](https://razorpay.com/)
- **Mobile Wrapper**: [Capacitor JS](https://capacitorjs.com/) for Android builds

---

## 🛠️ Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** database (or a cloud provider like Neon/Supabase)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Souravshukla007/LakshyaSSB.git
   cd LakshyaSSB
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory based on `.env.example`:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/lakshyassb"

   # App Settings
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # Security
   JWT_SECRET="your-super-secret-jwt-key"
   CRON_SECRET="your-cron-secret-key"

   # Services
   RESEND_API_KEY="re_your_resend_key"
   RAZORPAY_KEY_ID="rzp_test_your_key"
   RAZORPAY_KEY_SECRET="your_razorpay_secret"
   NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_your_key"
   ```

4. **Initialize Database:**
   Run Prisma migrations to set up your database schema.
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

---

## 📂 Project Structure

```text
LakshyaSSB/
├── app/                  # Next.js App Router (Pages, Layouts, API routes)
│   ├── api/              # Backend API routes (OTP, PIQ, Medical)
│   ├── auth/             # Authentication pages
│   ├── ssb/              # Day 1 to Day 5 interactive guides
│   └── ...               # Other main pages (Leaderboard, Navigator, Medical, etc.)
├── components/           # Reusable UI components (Navbar, Footer, Forms, Cards)
├── lib/                  # Utility functions and core logic (Scoring systems, Prisma client)
├── prisma/               # Database schema (`schema.prisma`) and migrations
└── public/               # Static assets (Images, Icons)
```

---

## 🛡️ Best Practices & Design System

- **Performance**: Leveraging React Server Components where heavy data fetching logic resides (reducing client bundle size).
- **Responsive Design**: Built Mobile-First. The UI smoothly scales from smallest smartphones to large desktop monitors.
- **Aesthetics**: Adheres to the "LakshyaSSB Design System":
  - Clean beige grid backgrounds (`#fafaf9`)
  - Crisp white glass-morphism cards with subtle borders
  - Brand Orange accents (`#F97316`) for CTAs and highlights
  - Dark Slate (`#1a1a1a`) for primary text and headings

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check out the [issues page](https://github.com/Souravshukla007/LakshyaSSB/issues).

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Built with ❤️ for Indian Armed Forces Aspirants.*
