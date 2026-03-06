import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const profileSchema = z.object({
  companyName: z.string().min(1, "Nama perusahaan wajib diisi"),
  ownerName: z.string().min(1, "Nama owner wajib diisi"),
  email: z.string().email("Email tidak valid"),
  phone: z.string().min(1, "No HP wajib diisi"),
  address: z.string().min(1, "Alamat wajib diisi"),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = profileSchema.parse(body)

    // Update or create owner profile
    const owner = await prisma.owner.upsert({
      where: { id: session.user.ownerId },
      update: {
        companyName: validatedData.companyName,
        ownerName: validatedData.ownerName,
        email: validatedData.email,
        phone: validatedData.phone,
        address: validatedData.address,
      },
      create: {
        id: session.user.ownerId,
        companyName: validatedData.companyName,
        ownerName: validatedData.ownerName,
        email: validatedData.email,
        phone: validatedData.phone,
        address: validatedData.address,
      },
    })

    // Update user to mark profile as complete
    await prisma.user.update({
      where: { id: session.user.id },
      data: { mustCompleteProfile: false },
    })

    return NextResponse.json({ success: true, owner })
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
