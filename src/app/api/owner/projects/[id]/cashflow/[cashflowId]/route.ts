
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const cashflowRabUpdateSchema = z.object({
  quantity: z.number().min(0.01, "Qty wajib diisi"),
  unit: z.string().optional(),
  unitPrice: z.number().min(0).optional(), // RAB Price
  budget: z.number().min(0, "Budget harus lebih dari 0"), // RAB Budget
})

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; cashflowId: string }> }
) {
  try {
    const { id, cashflowId } = await context.params
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    // Parse partial update
    const { quantity, unit, unitPrice, budget } = cashflowRabUpdateSchema.parse(body)

    const cashflow = await prisma.cashflow.findUnique({
      where: {
        id: cashflowId,
        projectId: id,
        ownerId: session.user.ownerId,
      },
    })

    if (!cashflow) {
      return NextResponse.json({ message: "Cashflow not found" }, { status: 404 })
    }

    const updatedCashflow = await prisma.cashflow.update({
      where: { id: cashflowId },
      data: {
        quantity,
        unit,
        unitPrice, // RAB Unit Price
        budget,    // RAB Budget
      },
    })

    return NextResponse.json(updatedCashflow)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errors = error.errors || error.issues || []
      const message = errors[0]?.message || "Validation Error"
      return NextResponse.json({ message }, { status: 400 })
    }
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 })
  }
}
