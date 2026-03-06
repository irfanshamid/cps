import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole, ProjectStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const projectSchema = z.object({
  name: z.string().min(1, "Nama proyek wajib diisi").optional(),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  budget: z.number().min(0, "Budget harus lebih dari 0").optional(),
})

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

    return NextResponse.json({ success: true, project })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

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
    const validatedData = projectSchema.parse(body)

    // Check if project exists and belongs to owner
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        ownerId: session.user.ownerId,
      },
    })

    if (!existingProject) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 }
      )
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.startDate !== undefined && {
          startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        }),
        ...(validatedData.endDate !== undefined && {
          endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        }),
        ...(validatedData.budget !== undefined && { budget: validatedData.budget }),
      },
    })

    // Check and update over budget flag
    const spent = Number(project.spent)
    const budget = Number(project.budget)
    const isOverBudget = spent > budget

    await prisma.project.update({
      where: { id },
      data: { isOverBudget },
    })

    return NextResponse.json({ success: true, project })
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

    // Check if project exists and belongs to owner
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

    // Delete project (cascade will handle related records)
    await prisma.project.delete({
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
