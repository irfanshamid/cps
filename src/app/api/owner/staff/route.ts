import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { generateRandomPassword, hashPassword } from "@/utils/password"
import { z } from "zod"

const createStaffSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter").max(50, "Username maksimal 50 karakter"),
  position: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get("date")

    if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let attendanceDate = new Date()
    if (dateParam) {
      attendanceDate = new Date(dateParam)
    }
    
    // Set to start and end of day for accurate querying
    const startOfDay = new Date(attendanceDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(attendanceDate)
    endOfDay.setHours(23, 59, 59, 999)

    const staff = await prisma.user.findMany({
      where: {
        ownerId: session.user.ownerId,
        role: UserRole.STAFF,
      },
      select: {
        id: true,
        username: true,
        isActive: true,
        createdAt: true,
        position: true,
        attendances: {
          where: {
            date: {
              gte: startOfDay,
              lte: endOfDay,
            }
          },
          select: {
            id: true,
            status: true,
            checkIn: true,
            checkOut: true,
          },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, staff })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { username, position } = createStaffSchema.parse(body)

    const existing = await prisma.user.findUnique({
      where: { username },
    })

    if (existing) {
      return NextResponse.json(
        { message: "Username sudah digunakan" },
        { status: 400 }
      )
    }

    const password = generateRandomPassword(12)
    const hashedPassword = await hashPassword(password)

    const staff = await prisma.user.create({
      data: {
        username,
        position,
        password: hashedPassword,
        role: UserRole.STAFF,
        ownerId: session.user.ownerId,
        isActive: true,
        mustCompleteProfile: true, // Staff must also complete profile
      },
    })

    return NextResponse.json({
      success: true,
      id: staff.id,
      username: staff.username,
      password,
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

