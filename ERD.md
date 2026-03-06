# Entity Relationship Diagram (ERD)

## Database Schema Overview

### Core Entities

#### 1. User
- **Primary Key**: `id` (String, CUID)
- **Attributes**:
  - `username` (String, Unique)
  - `password` (String, Hashed)
  - `role` (Enum: ADMIN, OWNER, STAFF)
  - `ownerId` (String, Foreign Key → Owner.id, Nullable)
  - `isActive` (Boolean, Default: true)
  - `mustCompleteProfile` (Boolean, Default: false)
  - `createdAt` (DateTime)
  - `updatedAt` (DateTime)

**Relationships**:
- Many-to-One with Owner (via `ownerId`)
- One-to-Many with Attendance

#### 2. Owner
- **Primary Key**: `id` (String, CUID)
- **Attributes**:
  - `companyName` (String, Nullable)
  - `ownerName` (String, Nullable)
  - `email` (String, Unique, Nullable)
  - `phone` (String, Nullable)
  - `address` (String, Nullable)
  - `companyLogo` (String, Nullable - URL)
  - `isBanned` (Boolean, Default: false)
  - `createdAt` (DateTime)
  - `updatedAt` (DateTime)

**Relationships**:
- One-to-Many with User (OWNER & STAFF roles)
- One-to-Many with Project
- One-to-Many with Cashflow
- One-to-Many with RAB
- One-to-Many with Termin
- One-to-Many with EarlyWarning

#### 3. Project
- **Primary Key**: `id` (String, CUID)
- **Attributes**:
  - `name` (String)
  - `description` (String, Nullable)
  - `status` (Enum: PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED)
  - `startDate` (DateTime, Nullable)
  - `endDate` (DateTime, Nullable)
  - `budget` (Decimal 15,2)
  - `spent` (Decimal 15,2)
  - `isOverBudget` (Boolean, Default: false)
  - `ownerId` (String, Foreign Key → Owner.id)
  - `createdAt` (DateTime)
  - `updatedAt` (DateTime)

**Relationships**:
- Many-to-One with Owner
- One-to-Many with RAB
- One-to-Many with Cashflow
- One-to-Many with Termin
- One-to-Many with EarlyWarning

#### 4. RAB (Rencana Anggaran Biaya)
- **Primary Key**: `id` (String, CUID)
- **Attributes**:
  - `name` (String)
  - `description` (String, Nullable)
  - `budget` (Decimal 15,2)
  - `spent` (Decimal 15,2)
  - `isOverBudget` (Boolean, Default: false)
  - `projectId` (String, Foreign Key → Project.id)
  - `ownerId` (String, Foreign Key → Owner.id)
  - `createdAt` (DateTime)
  - `updatedAt` (DateTime)

**Relationships**:
- Many-to-One with Project
- Many-to-One with Owner

#### 5. Cashflow
- **Primary Key**: `id` (String, CUID)
- **Attributes**:
  - `type` (Enum: IN, OUT)
  - `amount` (Decimal 15,2)
  - `description` (String, Nullable)
  - `category` (String, Nullable)
  - `projectId` (String, Foreign Key → Project.id, Nullable)
  - `ownerId` (String, Foreign Key → Owner.id)
  - `createdAt` (DateTime)
  - `updatedAt` (DateTime)

**Relationships**:
- Many-to-One with Project (Optional)
- Many-to-One with Owner

#### 6. Termin
- **Primary Key**: `id` (String, CUID)
- **Attributes**:
  - `name` (String)
  - `description` (String, Nullable)
  - `amount` (Decimal 15,2)
  - `percentage` (Decimal 5,2, Nullable)
  - `status` (Enum: PENDING, APPROVED, PAID, REJECTED)
  - `dueDate` (DateTime, Nullable)
  - `paidDate` (DateTime, Nullable)
  - `projectId` (String, Foreign Key → Project.id)
  - `ownerId` (String, Foreign Key → Owner.id)
  - `createdAt` (DateTime)
  - `updatedAt` (DateTime)

**Relationships**:
- Many-to-One with Project
- Many-to-One with Owner

#### 7. Attendance
- **Primary Key**: `id` (String, CUID)
- **Attributes**:
  - `userId` (String, Foreign Key → User.id)
  - `date` (DateTime)
  - `checkIn` (DateTime, Nullable)
  - `checkOut` (DateTime, Nullable)
  - `status` (Enum: PRESENT, LATE, ABSENT, SICK, LEAVE)
  - `notes` (String, Nullable)
  - `createdAt` (DateTime)
  - `updatedAt` (DateTime)

**Relationships**:
- Many-to-One with User

**Constraints**:
- Unique constraint on (`userId`, `date`)

#### 8. EarlyWarning
- **Primary Key**: `id` (String, CUID)
- **Attributes**:
  - `projectId` (String, Foreign Key → Project.id)
  - `ownerId` (String, Foreign Key → Owner.id)
  - `message` (String)
  - `predictedDeficit` (Decimal 15,2)
  - `daysUntilDeficit` (Int)
  - `burnRate30Days` (Decimal 15,2)
  - `obligations30Days` (Decimal 15,2)
  - `currentBalance` (Decimal 15,2)
  - `isResolved` (Boolean, Default: false)
  - `createdAt` (DateTime)
  - `updatedAt` (DateTime)

**Relationships**:
- Many-to-One with Project
- Many-to-One with Owner

## Relationship Summary

```
User (ADMIN) ──┐
               │
User (OWNER) ──┼──→ Owner ──→ Project ──→ RAB
               │              │           │
               │              ├──→ Cashflow
               │              ├──→ Termin
               │              └──→ EarlyWarning
               │
User (STAFF) ──┘
               │
               └──→ Attendance
```

## Indexes

- **User**: `username`, `role`, `ownerId`
- **Owner**: `email`
- **Project**: `ownerId`, `status`
- **RAB**: `projectId`, `ownerId`
- **Cashflow**: `ownerId`, `projectId`, `type`, `createdAt`
- **Termin**: `projectId`, `ownerId`, `status`
- **Attendance**: `userId`, `date`
- **EarlyWarning**: `projectId`, `ownerId`, `isResolved`

## Enums

- **UserRole**: ADMIN, OWNER, STAFF
- **CashflowType**: IN, OUT
- **ProjectStatus**: PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED
- **TerminStatus**: PENDING, APPROVED, PAID, REJECTED
- **AttendanceStatus**: PRESENT, LATE, ABSENT, SICK, LEAVE
