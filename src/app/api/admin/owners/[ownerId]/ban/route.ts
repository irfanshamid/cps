import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const banSchema = z.object({
  isBanned: z.boolean(),
})

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ ownerId: string }> }
) {
  try {
    const { ownerId } = await context.params
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { isBanned } = banSchema.parse(body)

    // Update owner ban status
    const owner = await prisma.owner.update({
      where: { id: ownerId },
      data: { isBanned },
    })

    // Also update all users under this owner to inactive if banned
    if (isBanned) {
      await prisma.user.updateMany({
        where: { ownerId },
        data: { isActive: false },
      })
    } else {
      // Reactivate owner user when unbanned
      await prisma.user.updateMany({
        where: { 
          ownerId,
          role: UserRole.OWNER,
        },
        data: { isActive: true },
      })
    }

    return NextResponse.json({
      success: true,
      owner,
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
