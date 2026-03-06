
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const toggleSchema = z.object({
  isActive: z.boolean(),
})

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
    const { isActive } = toggleSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user || user.role !== UserRole.STAFF || user.ownerId !== session.user.ownerId) {
      return NextResponse.json(
        { message: "Staff tidak ditemukan" },
        { status: 404 }
      )
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
    })

    return NextResponse.json({ success: true, user: updated })
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
