import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { generateRandomPassword, hashPassword } from "@/utils/password"
import { z } from "zod"

const generateSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter").max(50, "Username maksimal 50 karakter"),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { username } = generateSchema.parse(body)

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "Username sudah digunakan" },
        { status: 400 }
      )
    }

    // Generate password
    const password = generateRandomPassword(12)
    const hashedPassword = await hashPassword(password)

    // Create owner record first
    const owner = await prisma.owner.create({
      data: {
        companyName: "",
        ownerName: "",
        email: "",
        phone: "",
        address: "",
      },
    })

    // Create user with OWNER role
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: UserRole.OWNER,
        ownerId: owner.id,
        isActive: true,
        mustCompleteProfile: true, // Owner harus complete profile dulu
      },
    })

    return NextResponse.json({
      success: true,
      username: user.username,
      password, // Return plain password untuk ditampilkan
      userId: user.id,
      ownerId: owner.id,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
