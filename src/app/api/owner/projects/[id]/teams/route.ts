
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const addMemberSchema = z.object({
  userId: z.string().min(1, "User wajib dipilih"),
  role: z.string().optional(),
})

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const members = await prisma.projectTeam.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            position: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, members })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

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

    const body = await req.json()
    const validatedData = addMemberSchema.parse(body)

    // Check if already exists
    const existing = await prisma.projectTeam.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: validatedData.userId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ message: "Staff sudah ada di tim proyek ini" }, { status: 400 })
    }

    const member = await prisma.projectTeam.create({
      data: {
        projectId: id,
        userId: validatedData.userId,
        role: validatedData.role,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            position: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, member })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params // This is projectId
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // We need userId from query param or body. Let's use query param ?userId=...
    const url = new URL(req.url)
    const userId = url.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ message: "User ID required" }, { status: 400 })
    }

    await prisma.projectTeam.delete({
      where: {
        projectId_userId: {
          projectId: id,
          userId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}
