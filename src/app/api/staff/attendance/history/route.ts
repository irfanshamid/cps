import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.STAFF) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const records = await prisma.attendance.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { date: "desc" },
    })

    return NextResponse.json({ success: true, records })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

