
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"

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

    // Get last 7 days history by default
    const history = await prisma.attendance.findMany({
      where: {
        userId: id,
      },
      orderBy: { date: "desc" },
      take: 7,
    })

    return NextResponse.json({ success: true, history })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}
