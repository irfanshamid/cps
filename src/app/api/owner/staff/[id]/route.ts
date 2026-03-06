
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateStaffSchema = z.object({
  position: z.string().optional(),
})

export async function PUT(
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
    const { position } = updateStaffSchema.parse(body)

    const staff = await prisma.user.findFirst({
      where: {
        id,
        ownerId: session.user.ownerId,
        role: UserRole.STAFF,
      },
    })

    if (!staff) {
      return NextResponse.json({ message: "Staff not found" }, { status: 404 })
    }

    await prisma.user.update({
      where: { id },
      data: { position },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}
