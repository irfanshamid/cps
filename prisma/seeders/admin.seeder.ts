import { PrismaClient, UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Seeding admin user...")

    const adminUsername = "admin"
    const adminPassword = "blueprint123"

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
        where: { username: adminUsername },
    })

    if (existingAdmin) {
        console.log("✅ Admin user already exists, skipping...")
        return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Create admin user
    const admin = await prisma.user.create({
        data: {
            username: adminUsername,
            password: hashedPassword,
            role: UserRole.ADMIN,
            isActive: true,
            mustCompleteProfile: false,
        },
    })

    console.log("✅ Admin user created successfully!")
    console.log(`   Username: ${adminUsername}`)
    console.log(`   Password: ${adminPassword}`)
    console.log(`   ID: ${admin.id}`)
}

main()
    .catch((e) => {
        console.error("❌ Error seeding admin:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
