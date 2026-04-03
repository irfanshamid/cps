import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole, CashflowType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const cashflowSchema = z.object({
  type: z.nativeEnum(CashflowType),
  amount: z.number().min(0.01, "Jumlah harus lebih dari 0").max(999999999999999.99, "Jumlah terlalu besar (maksimum Rp 999.999.999.999.999,99)"),
  date: z.string().nullable().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  projectId: z.string().nullable().optional(),
  quantity: z.number().max(99999999.99, "Qty terlalu besar (maksimum 99.999.999,99)").optional(),
  unit: z.string().optional(),
  unitPrice: z.number().max(999999999999999.99, "Harga per qty terlalu besar (maksimum Rp 999.999.999.999.999,99)").optional(),
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
    const validatedData = cashflowSchema.parse(body)
    const createdAt =
      validatedData.date && validatedData.date.length > 0
        ? new Date(`${validatedData.date}T00:00:00`)
        : undefined

    // If projectId is provided, verify it belongs to owner
    if (validatedData.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: validatedData.projectId,
          ownerId: session.user.ownerId,
        },
      })

      if (!project) {
        return NextResponse.json(
          { message: "Project not found or access denied" },
          { status: 404 }
        )
      }

      // Update project spent amount
      const currentSpent = Number(project.spent)
      const newSpent = validatedData.type === "OUT" 
        ? currentSpent + validatedData.amount
        : currentSpent

      const budget = Number(project.budget)
      const isOverBudget = newSpent > budget

      await prisma.project.update({
        where: { id: validatedData.projectId },
        data: {
          spent: newSpent,
          isOverBudget,
        },
      })
    }

    // Create cashflow transaction
    const cashflow = await prisma.cashflow.create({
      data: {
        type: validatedData.type,
        amount: validatedData.amount,
        description: validatedData.description,
        category: validatedData.category,
        projectId: validatedData.projectId,
        ownerId: session.user.ownerId,
        quantity: validatedData.quantity,
        unit: validatedData.unit,
        unitPrice: validatedData.unitPrice,
        ...(createdAt ? { createdAt } : {}),
      },
    })

    return NextResponse.json({ success: true, cashflow })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      )
    }

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")

    const cashflows = await prisma.cashflow.findMany({
      where: {
        ownerId: session.user.ownerId,
        ...(projectId && { projectId }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, cashflows })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    )
  }
}
