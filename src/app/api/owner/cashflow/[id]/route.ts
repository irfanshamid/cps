
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole, CashflowType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const cashflowSchema = z.object({
  type: z.nativeEnum(CashflowType),
  amount: z.number().min(0.01, "Jumlah harus lebih dari 0"),
  description: z.string().optional(),
  category: z.string().optional(),
  projectId: z.string().nullable().optional(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  unitPrice: z.number().optional(),
})

export async function PUT(
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

    const body = await req.json()
    const validatedData = cashflowSchema.parse(body)

    const existingCashflow = await prisma.cashflow.findFirst({
      where: {
        id,
        ownerId: session.user.ownerId,
      },
    })

    if (!existingCashflow) {
      return NextResponse.json(
        { message: "Cashflow not found" },
        { status: 404 }
      )
    }

    // Handle project budget updates if projectId changes or amount changes
    if (existingCashflow.projectId || validatedData.projectId) {
      // 1. Revert effect of old cashflow on old project
      if (existingCashflow.projectId && existingCashflow.type === "OUT") {
        const oldProject = await prisma.project.findUnique({ where: { id: existingCashflow.projectId } })
        if (oldProject) {
          const newSpent = Number(oldProject.spent) - Number(existingCashflow.amount)
          await prisma.project.update({
            where: { id: existingCashflow.projectId },
            data: { spent: newSpent, isOverBudget: newSpent > Number(oldProject.budget) },
          })
        }
      }

      // 2. Apply effect of new cashflow on new project
      if (validatedData.projectId && validatedData.type === "OUT") {
        const newProject = await prisma.project.findUnique({ where: { id: validatedData.projectId } })
        if (newProject) {
          const newSpent = Number(newProject.spent) + validatedData.amount
          await prisma.project.update({
            where: { id: validatedData.projectId },
            data: { spent: newSpent, isOverBudget: newSpent > Number(newProject.budget) },
          })
        }
      }
    }

    const updatedCashflow = await prisma.cashflow.update({
      where: { id },
      data: {
        type: validatedData.type,
        amount: validatedData.amount,
        description: validatedData.description,
        category: validatedData.category,
        projectId: validatedData.projectId,
        quantity: validatedData.quantity,
        unit: validatedData.unit,
        unitPrice: validatedData.unitPrice,
      },
    })

    return NextResponse.json({ success: true, cashflow: updatedCashflow })
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

export async function DELETE(
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

    const existingCashflow = await prisma.cashflow.findFirst({
      where: {
        id,
        ownerId: session.user.ownerId,
      },
    })

    if (!existingCashflow) {
      return NextResponse.json(
        { message: "Cashflow not found" },
        { status: 404 }
      )
    }

    // Revert project spent amount if it was an expense linked to a project
    if (existingCashflow.projectId && existingCashflow.type === "OUT") {
      const project = await prisma.project.findUnique({ where: { id: existingCashflow.projectId } })
      if (project) {
        const newSpent = Number(project.spent) - Number(existingCashflow.amount)
        await prisma.project.update({
          where: { id: existingCashflow.projectId },
          data: { spent: newSpent, isOverBudget: newSpent > Number(project.budget) },
        })
      }
    }

    await prisma.cashflow.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
