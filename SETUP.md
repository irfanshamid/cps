# Setup Guide - Blueprint System

Sistem Manajemen Cashflow & Proyek untuk Bisnis Kontraktor

## Prerequisites

- Node.js 20.x (gunakan `nvm use 20`)
- MySQL Database (TiDB Cloud atau MySQL lokal)
- npm atau yarn

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd /Users/mac/Documents/Development/thinkwithai/blueprint
nvm use 20
npm install
```

### 2. Setup Environment Variables

Pastikan file `.env` sudah ada dengan konfigurasi berikut:

```env
# Database
DATABASE_URL="mysql://user:password@host:port/database?sslaccept=strict"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

**Generate NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

### 3. Setup Database

#### Generate Prisma Client
```bash
npm run db:generate
```

#### Push Schema ke Database
```bash
npm run db:push
```

**Atau menggunakan Migration** (recommended untuk production):
```bash
npm run db:migrate
```

### 4. Seed Default Admin User

```bash
npm run db:seed
```

Ini akan membuat admin user dengan credentials:
- **Username**: `admin`
- **Password**: `blueprint123`

⚠️ **PENTING**: Ganti password admin setelah pertama kali login!

### 5. Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## Default Credentials

### Admin
- Username: `admin`
- Password: `blueprint123`

## Folder Structure

```
blueprint/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seeders/
│       └── admin.seeder.ts    # Admin seeder
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/         # Login page
│   │   ├── admin/             # Admin routes
│   │   │   └── dashboard/
│   │   ├── owner/             # Owner routes
│   │   │   └── dashboard/
│   │   ├── staff/             # Staff routes
│   │   │   └── dashboard/
│   │   ├── onboarding/        # Owner onboarding
│   │   ├── api/               # API routes
│   │   │   ├── auth/[...nextauth]/
│   │   │   └── owner/
│   │   └── dashboard/         # Dashboard redirect
│   ├── components/
│   │   ├── layout/
│   │   │   └── header.tsx     # Header dengan avatar
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   └── prisma.ts          # Prisma client
│   ├── middleware.ts          # RBAC middleware
│   ├── types/
│   │   └── next-auth.d.ts     # Type definitions
│   └── utils/
│       └── password.ts        # Password utilities
└── .env                       # Environment variables
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed admin user

## Role-Based Access Control (RBAC)

### ADMIN
- Akses: `/admin/*`
- Fitur:
  - Dashboard Admin (statistik platform)
  - Management User (generate owner, ban/unban)
  - **TIDAK** bisa akses data keuangan detail owner

### OWNER
- Akses: `/owner/*`
- Fitur:
  - Dashboard Cashflow
  - Projects (CRUD)
  - RAB Builder
  - Cashflow Management
  - Termin System
  - Team Management
  - Edit Profile
- **Onboarding wajib** saat pertama login

### STAFF
- Akses: `/staff/*`
- Fitur:
  - Dashboard Staff (presensi saja)
  - Presensi masuk/pulang
  - Riwayat presensi pribadi
- **TIDAK** bisa akses: proyek, cashflow, RAB, termin, data staff lain

## Security Features

1. **Password Hashing**: Menggunakan bcryptjs (12 rounds)
2. **RBAC Middleware**: Protect routes berdasarkan role
3. **Session Management**: NextAuth.js dengan JWT strategy
4. **Data Isolation**: Staff hanya bisa akses data sendiri
5. **Admin Restriction**: Admin tidak bisa akses detail keuangan owner

## Next Steps

1. ✅ Setup selesai
2. 🔄 Login sebagai admin
3. 🔄 Generate owner baru dari admin dashboard
4. 🔄 Login sebagai owner dan complete profile
5. 🔄 Mulai menggunakan sistem

## Troubleshooting

### Prisma Client Error
```bash
npm run db:generate
```

### Database Connection Error
- Pastikan `DATABASE_URL` di `.env` benar
- Pastikan database sudah dibuat
- Pastikan kredensial database benar

### NextAuth Error
- Pastikan `NEXTAUTH_SECRET` sudah di-set
- Pastikan `NEXTAUTH_URL` sesuai environment

### TypeScript Errors
```bash
npm run db:generate
```

## Production Deployment

1. Set environment variables di hosting platform
2. Run migrations: `npm run db:migrate`
3. Seed admin: `npm run db:seed`
4. Build: `npm run build`
5. Start: `npm run start`

## Support

Untuk pertanyaan atau issue, silakan buat issue di repository.
