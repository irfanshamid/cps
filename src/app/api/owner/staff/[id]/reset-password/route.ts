
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
    const { id } = await context.params
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user || user.role !== UserRole.STAFF || user.ownerId !== session.user.ownerId) {
      return NextResponse.json(
        { message: "Staff tidak ditemukan" },
        { status: 404 }
      )
    }

    const password = generateRandomPassword(12)
    const hashedPassword = await hashPassword(password)

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      success: true,
      username: user.username,
      password,
    })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
