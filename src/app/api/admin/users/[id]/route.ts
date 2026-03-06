
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { username, role, isActive } = body

    // Validate inputs
    if (username === "") {
      return NextResponse.json({ message: "Username cannot be empty" }, { status: 400 })
    }

    // Check if username exists (if changed)
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id },
        },
      })
      if (existingUser) {
        return NextResponse.json({ message: "Username already exists" }, { status: 400 })
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        username: username || undefined,
        role: role || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Prevent deleting self
    if (id === session.user.id) {
      return NextResponse.json({ message: "Cannot delete yourself" }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}
