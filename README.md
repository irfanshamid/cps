# Blueprint System

Sistem Manajemen Cashflow & Proyek untuk Bisnis Kontraktor

Scalable dan siap dikembangkan menjadi SaaS.

## 🚀 Features

### Authentication & RBAC
- ✅ Login system dengan Role-Based Access Control (RBAC)
- ✅ 3 Role: ADMIN, OWNER, STAFF
- ✅ Password hashing dengan bcryptjs
- ✅ Session management dengan NextAuth.js

### Admin Dashboard
- 📊 Dashboard dengan statistik platform
- 👥 Management User (generate owner, ban/unban)
- 📈 Total owner terdaftar, proyek, cashflow sistem

### Owner Dashboard
- 💰 Dashboard Cashflow (Total in/out, saldo, status)
- 📁 Projects Management (CRUD)
- 📋 RAB Builder (Budget control + over budget flag)
- 💵 Cashflow Management (Transaksi real-time)
- 📝 Termin Payment System
- 👨‍💼 Team Management (Add/reset staff)
- ⚠️ Early Warning System (Krisis kas detection)
- 📝 Edit Profile

### Staff Dashboard
- ✅ Presensi masuk/pulang
- 📅 Riwayat presensi pribadi
- 🔒 Data isolation (hanya akses data sendiri)

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: MySQL (Prisma ORM)
- **Authentication**: NextAuth.js v5
- **UI Components**: shadcn/ui (Tailwind CSS)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Notifications**: Sonner (Toast)

## 📋 Prerequisites

- Node.js 20.x
- MySQL Database
- npm atau yarn

## 🚀 Quick Start

### 1. Install Dependencies

```bash
nvm use 20
npm install
```

### 2. Setup Environment

Copy `.env.example` ke `.env` dan isi dengan konfigurasi database Anda:

```bash
cp .env.example .env
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed admin user
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 🔐 Default Credentials

**Admin**:
- Username: `admin`
- Password: `blueprint123`

⚠️ **PENTING**: Ganti password admin setelah pertama kali login!

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [ERD Documentation](./ERD.md) - Database schema & relationships

## 📁 Project Structure

```
blueprint/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seeders/               # Database seeders
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Auth routes
│   │   ├── admin/             # Admin routes
│   │   ├── owner/             # Owner routes
│   │   ├── staff/             # Staff routes
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── layout/            # Layout components
│   │   └── ui/                # shadcn/ui components
│   ├── lib/                   # Utilities & configs
│   ├── middleware.ts          # RBAC middleware
│   ├── types/                 # TypeScript types
│   └── utils/                 # Helper functions
└── .env                       # Environment variables
```

## 🔒 Security Features

- ✅ Password hashing (bcryptjs)
- ✅ RBAC middleware protection
- ✅ Session management (JWT)
- ✅ Data isolation per role
- ✅ Admin cannot access owner financial details

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed admin user

## 🎯 Roadmap

- [ ] Complete Admin Management User features
- [ ] Complete Owner Projects CRUD
- [ ] Complete RAB Builder
- [ ] Complete Cashflow Management
- [ ] Complete Termin System
- [ ] Complete Early Warning System
- [ ] Complete Team Management
- [ ] Complete Attendance System
- [ ] Add unit tests
- [ ] Add E2E tests
- [ ] Production deployment guide

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 👥 Authors

- Development Team

---

**Note**: This is a production-level architecture, modular & clean, ready to scale to SaaS.
