import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const rabSchema = z.object({
  name: z.string().min(1, "Nama item wajib diisi"),
  description: z.string().optional(),
  category: z.string().min(1, "Kategori wajib diisi"),
  quantity: z.number().min(0.01, "Qty wajib diisi"),
  unit: z.string().optional(),
  frequency: z.string().optional(),
  budget: z.number().min(0, "Budget harus lebih dari 0"),
  unitPrice: z.number().min(0).optional(),
  realUnitPrice: z.number().min(0).optional(),
  realAmount: z.number().min(0).optional(),
  remarks: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { message: "Project ID tidak valid" },
        { status: 400 }
      )
    }

    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = rabSchema.parse(body)

    // Verify project exists and belongs to owner
    const project = await prisma.project.findFirst({
      where: {
        id,
        ownerId: session.user.ownerId,
      },
    })

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 }
      )
    }

    const rab = await prisma.rAB.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        quantity: validatedData.quantity,
        unit: validatedData.unit,
        frequency: validatedData.frequency,
        remarks: validatedData.remarks,
        budget: validatedData.budget,
        unitPrice: validatedData.unitPrice,
        realUnitPrice: validatedData.realUnitPrice,
        spent: validatedData.realAmount ?? 0,
        projectId: id,
        ownerId: session.user.ownerId,
      },
    })

    return NextResponse.json({ success: true, rab })
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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const rabs = await prisma.rAB.findMany({
      where: {
        projectId: id,
        ownerId: session.user.ownerId,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, rabs })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
