import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const terminSchema = z.object({
  name: z.string().min(1, "Nama termin wajib diisi"),
  description: z.string().optional(),
  amount: z.number().min(0.01, "Amount harus lebih dari 0"),
  percentage: z.number().min(0).max(100).nullable().optional(),
  dueDate: z.string().nullable().optional(),
  status: z.enum(["PENDING", "APPROVED", "PAID", "REJECTED"]).optional(),
})

export async function POST(
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
    const validatedData = terminSchema.parse(body)

    // Verify project exists and belongs to owner
    const project = await prisma.project.findFirst({
      where: {
        id,
        ownerId: session.user.ownerId!,
      },
    })

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create Termin
      const termin = await tx.termin.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          amount: validatedData.amount,
          percentage: validatedData.percentage,
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
          status: validatedData.status || "PENDING",
          paidDate: validatedData.status === "PAID" ? new Date() : null,
          projectId: id,
          ownerId: session.user.ownerId!,
        },
      })

      // If PAID, create Cashflow IN
      if (validatedData.status === "PAID") {
        await tx.cashflow.create({
          data: {
            type: "IN",
            amount: validatedData.amount,
            description: `Termin: ${validatedData.name}`,
            category: "Termin Payment",
            quantity: 1,
            unit: "ls",
            unitPrice: validatedData.amount,
            budget: validatedData.amount, // Assume budget matched amount for termin
            projectId: id,
            ownerId: session.user.ownerId!,
            terminId: termin.id,
          },
        })
      }
      
      return termin
    })

    return NextResponse.json({ success: true, termin: result })
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

    const termins = await prisma.termin.findMany({
      where: {
        projectId: id,
        ownerId: session.user.ownerId,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, termins })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
