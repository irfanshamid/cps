
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const taskSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  description: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  projectId: z.string().min(1, "Proyek wajib dipilih"),
  picId: z.string().optional(),
  picNote: z.string().optional(),
  deadline: z.string().optional(), // ISO date string
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = taskSchema.parse(body)

    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        progress: validatedData.progress,
        projectId: validatedData.projectId,
        picId: validatedData.picId || null,
        picNote: validatedData.picNote,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        ownerId: session.user.ownerId,
      },
    })

    return NextResponse.json({ success: true, task })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const tasks = await prisma.task.findMany({
      where: {
        ownerId: session.user.ownerId,
      },
      include: {
        project: { select: { id: true, name: true } },
        pic: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, tasks })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
  }
}
