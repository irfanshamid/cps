import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { UserRole, ProjectStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const projectSchema = z.object({
  name: z.string().min(1, "Nama proyek wajib diisi"),
  description: z.string().optional(),
  status: z.nativeEnum(ProjectStatus),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  budget: z.number().min(0, "Budget harus lebih dari 0"),
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
    const validatedData = projectSchema.parse(body)

    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        status: validatedData.status,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        budget: validatedData.budget,
        ownerId: session.user.ownerId,
      },
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

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const projects = await prisma.project.findMany({
      where: { ownerId: session.user.ownerId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, projects })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
