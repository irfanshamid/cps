
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const rabUpdateSchema = z.object({
  name: z.string().min(1, "Nama item wajib diisi"),
  description: z.string().optional().nullable(),
  category: z.string().min(1, "Kategori wajib diisi"),
  quantity: z.number().min(0.01, "Qty wajib diisi"),
  unit: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  budget: z.number().min(0, "Budget harus lebih dari 0"),
  unitPrice: z.number().min(0).optional().nullable(),
  realUnitPrice: z.number().min(0).optional().nullable(),
  remarks: z.string().optional().nullable(),
})

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; rabId: string }> }
) {
  try {
    const { id, rabId } = await context.params
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = rabUpdateSchema.parse(body)

    const rab = await prisma.rAB.findUnique({
      where: {
        id: rabId,
        projectId: id,
        ownerId: session.user.ownerId,
      },
    })

    if (!rab) {
      return NextResponse.json({ message: "RAB not found" }, { status: 404 })
    }

    const updatedRab = await prisma.rAB.update({
      where: { id: rabId },
      data: {
        name: validatedData.name,
        description: validatedData.description ?? null,
        category: validatedData.category,
        quantity: validatedData.quantity,
        unit: validatedData.unit ?? null,
        frequency: validatedData.frequency ?? null,
        budget: validatedData.budget,
        unitPrice: validatedData.unitPrice ?? null,
        realUnitPrice: validatedData.realUnitPrice ?? null,
        remarks: validatedData.remarks ?? null,
        // Calculate spent if needed based on realUnitPrice * quantity
        spent: validatedData.quantity && validatedData.realUnitPrice 
          ? validatedData.quantity * validatedData.realUnitPrice 
          : rab.spent, 
      },
    })

    return NextResponse.json(updatedRab)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      // Safe access to errors/issues
      const errors = error.errors || error.issues || []
      const message = errors[0]?.message || "Validation Error"
      return NextResponse.json({ message }, { status: 400 })
    }
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; rabId: string }> }
) {
  try {
    const { id, rabId } = await context.params
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const rab = await prisma.rAB.findUnique({
      where: {
        id: rabId,
        projectId: id,
        ownerId: session.user.ownerId,
      },
    })

    if (!rab) {
      return NextResponse.json({ message: "RAB not found" }, { status: 404 })
    }

    await prisma.rAB.delete({
      where: { id: rabId },
    })

    return NextResponse.json({ message: "RAB deleted successfully" })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 })
  }
}
