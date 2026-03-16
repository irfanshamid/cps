import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
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
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = profileSchema.parse(body)

    // Handle OWNER role (update owner profile)
    if (String(session.user.role) === "OWNER") {
      let ownerId = session.user.ownerId

      // If ownerId is missing, create it now
      if (!ownerId) {
        const owner = await prisma.owner.create({
          data: {
            companyName: validatedData.companyName,
            ownerName: validatedData.ownerName,
            email: validatedData.email,
            phone: validatedData.phone,
            address: validatedData.address,
          },
        })
        ownerId = owner.id
        
        // Link user to this new owner
        await prisma.user.update({
          where: { id: session.user.id },
          data: { ownerId },
        })
      } else {
        await prisma.owner.upsert({
          where: { id: ownerId },
          update: {
            companyName: validatedData.companyName,
            ownerName: validatedData.ownerName,
            email: validatedData.email,
            phone: validatedData.phone,
            address: validatedData.address,
          },
          create: {
            id: ownerId,
            companyName: validatedData.companyName,
            ownerName: validatedData.ownerName,
            email: validatedData.email,
            phone: validatedData.phone,
            address: validatedData.address,
          },
        })
      }
    }

    // Update user to mark profile as complete for ALL roles
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { mustCompleteProfile: false },
    })

    return NextResponse.json({ 
      success: true, 
      ownerId: updatedUser.ownerId,
      mustCompleteProfile: false 
    })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    )
  }
}
