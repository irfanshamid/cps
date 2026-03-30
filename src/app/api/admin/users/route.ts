
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { generateRandomPassword, hashPassword } from "@/utils/password"

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || "ALL"

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.username = { contains: search }
    }

    if (role && role !== "ALL") {
      where.role = role
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
          owner: {
            select: { companyName: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { username, role, password } = body

    if (!username || !role) {
      return NextResponse.json({ message: "Username and role are required" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json({ message: "Username already exists" }, { status: 400 })
    }

    const plainPassword = password || generateRandomPassword(12)
    const hashedPassword = await hashPassword(plainPassword)

    // Handle OWNER creation - need an owner record
    let ownerId = null
    if (role === "OWNER") {
      const owner = await prisma.owner.create({
        data: {},
      })
      ownerId = owner.id
    }

    const user = await prisma.user.create({
      data: {
        username,
        role,
        password: hashedPassword,
        isActive: true,
        mustCompleteProfile: true, // New users must complete profile
        ownerId, // Link to owner record if created
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      plainPassword, // Return plain password once for copying
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}
