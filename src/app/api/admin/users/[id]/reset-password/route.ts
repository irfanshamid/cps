
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { generateRandomPassword, hashPassword } from "@/utils/password"

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { newPassword } = body

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { message: "User tidak ditemukan" },
        { status: 404 }
      )
    }

    // Generate or use provided password
    const password = newPassword || generateRandomPassword(12)
    const hashedPassword = await hashPassword(password)

    // Update password and force profile completion
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustCompleteProfile: true, // Force re-onboarding after reset
      },
    })

    return NextResponse.json({
      success: true,
      username: user.username,
      password, // Return plain password untuk ditampilkan
    })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    )
  }
}
