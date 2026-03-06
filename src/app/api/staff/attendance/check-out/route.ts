import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"

function getTodayRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return { start, end }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.STAFF) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { start, end } = getTodayRange()

    const existing = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        date: {
          gte: start,
          lt: end,
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { message: "Anda belum presensi masuk hari ini" },
        { status: 400 }
      )
    }

    if (existing.checkOut) {
      return NextResponse.json(
        { message: "Anda sudah presensi pulang hari ini" },
        { status: 400 }
      )
    }

    const now = new Date()

    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: now,
      },
    })

    return NextResponse.json({ success: true, attendance })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

