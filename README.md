# My Portfolio

A modern portfolio application built with Next.js, TypeScript, Tailwind CSS, and PostgreSQL (Prisma).

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   - Copy `.env.example` to `.env`
   - Update the `DATABASE_URL` with your PostgreSQL connection string

4. Run Prisma migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

5. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Management

- **View database in Prisma Studio**:
  ```bash
  npx prisma studio
  ```

- **Create a new migration**:
  ```bash
  npx prisma migrate dev --name your_migration_name
  ```

- **Reset database**:
  ```bash
  npx prisma migrate reset
  ```

## Project Structure

```
├── app/                  # Next.js app directory
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── lib/                 # Utility functions
│   └── prisma.ts        # Prisma client instance
├── prisma/              # Prisma schema and migrations
│   └── schema.prisma    # Database schema
├── public/              # Static assets
└── ...config files
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
