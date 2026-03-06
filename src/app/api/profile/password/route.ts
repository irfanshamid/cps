
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
})

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    // Manual validation first
    if (body.newPassword !== body.confirmPassword) {
         return NextResponse.json({ message: "Password baru tidak cocok" }, { status: 400 })
    }

    const validatedData = passwordSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isValid = await bcrypt.compare(validatedData.currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json({ message: "Password saat ini salah" }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ success: true, message: "Password berhasil diubah" })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}
