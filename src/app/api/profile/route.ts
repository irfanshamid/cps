
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const profileSchema = z.object({
  companyName: z.string().optional(),
  ownerName: z.string().optional(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let profileData = null

    if (session.user.role === UserRole.OWNER && session.user.ownerId) {
      profileData = await prisma.owner.findUnique({
        where: { id: session.user.ownerId },
      })
    } else {
        // For other roles, just return user info for now
        profileData = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { username: true, role: true }
        })
    }

    return NextResponse.json({ success: true, profile: profileData })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    
    if (session.user.role === UserRole.OWNER && session.user.ownerId) {
         const validatedData = profileSchema.parse(body)
         
         const updatedOwner = await prisma.owner.update({
             where: { id: session.user.ownerId },
             data: {
                 companyName: validatedData.companyName,
                 ownerName: validatedData.ownerName,
                 email: validatedData.email || null,
                 phone: validatedData.phone,
                 address: validatedData.address,
             }
         })
         
         return NextResponse.json({ success: true, profile: updatedOwner })
    }

    return NextResponse.json({ message: "Role not supported for profile update yet" }, { status: 400 })

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}
