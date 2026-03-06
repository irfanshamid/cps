
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateTaskSchema = z.object({
  progress: z.number().min(0).max(100),
  picNote: z.string().optional(),
})

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.STAFF) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = updateTaskSchema.parse(body)

    // Ensure task belongs to this staff
    const task = await prisma.task.findUnique({
      where: { id },
    })

    if (!task || task.picId !== session.user.id) {
      return NextResponse.json({ message: "Task not found or not assigned to you" }, { status: 404 })
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        progress: validatedData.progress,
        picNote: validatedData.picNote,
      },
    })

    return NextResponse.json({ success: true, task: updatedTask })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}
