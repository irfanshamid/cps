
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const terminUpdateSchema = z.object({
  name: z.string().min(1, "Nama termin wajib diisi"),
  description: z.string().optional().nullable(),
  amount: z.number().min(0.01, "Amount harus lebih dari 0"),
  percentage: z.number().min(0).max(100).nullable().optional(),
  dueDate: z.string().nullable().optional(),
  status: z.enum(["PENDING", "APPROVED", "PAID", "REJECTED"]),
})

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string; terminId: string }> }
) {
  try {
    const { id, terminId } = await context.params
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = terminUpdateSchema.parse(body)

    const existingTermin = await prisma.termin.findUnique({
      where: {
        id: terminId,
        projectId: id,
        ownerId: session.user.ownerId,
      },
      include: {
        cashflow: true,
      },
    })

    if (!existingTermin) {
      return NextResponse.json({ message: "Termin not found" }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update Termin
      const updatedTermin = await tx.termin.update({
        where: { id: terminId },
        data: {
          name: validatedData.name,
          description: validatedData.description ?? null,
          amount: validatedData.amount,
          percentage: validatedData.percentage ?? null,
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
          status: validatedData.status,
          paidDate: validatedData.status === "PAID" && existingTermin.status !== "PAID" ? new Date() : (validatedData.status !== "PAID" ? null : existingTermin.paidDate),
        },
      })

      // Handle Cashflow Logic
      if (validatedData.status === "PAID") {
        if (existingTermin.cashflow) {
          // Update existing cashflow
          await tx.cashflow.update({
            where: { id: existingTermin.cashflow.id },
            data: {
              amount: validatedData.amount,
              description: `Termin: ${validatedData.name}`,
              unitPrice: validatedData.amount,
              budget: validatedData.amount,
            },
          })
        } else {
          // Create new cashflow
          await tx.cashflow.create({
            data: {
              type: "IN",
              amount: validatedData.amount,
              description: `Termin: ${validatedData.name}`,
              category: "Termin Payment",
              quantity: 1,
              unit: "ls",
              unitPrice: validatedData.amount,
              budget: validatedData.amount,
              projectId: id,
              ownerId: session.user.ownerId,
              terminId: terminId,
            },
          })
        }
      } else {
        // If status is NOT PAID, but there was a cashflow, delete it?
        // Usually if payment is cancelled, cashflow should be removed.
        if (existingTermin.cashflow) {
          await tx.cashflow.delete({
            where: { id: existingTermin.cashflow.id },
          })
        }
      }

      return updatedTermin
    })

    return NextResponse.json({ success: true, termin: result })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; terminId: string }> }
) {
  try {
    const { id, terminId } = await context.params
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const termin = await prisma.termin.findUnique({
      where: {
        id: terminId,
        projectId: id,
        ownerId: session.user.ownerId,
      },
    })

    if (!termin) {
      return NextResponse.json({ message: "Termin not found" }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      // Find linked cashflow
      const linkedCashflow = await tx.cashflow.findUnique({
        where: { terminId: terminId },
      })
      
      if (linkedCashflow) {
        await tx.cashflow.delete({
          where: { id: linkedCashflow.id },
        })
      }
      
      await tx.termin.delete({
        where: { id: terminId },
      })
    })

    return NextResponse.json({ message: "Termin deleted successfully" })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}
