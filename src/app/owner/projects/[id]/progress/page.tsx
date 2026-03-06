
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ListTodo } from "lucide-react"
import { TaskList } from "@/components/owner/task-list"
import { AddTaskButton } from "@/components/owner/add-task-button"
import Link from "next/link"
import { SidebarProvider } from "@/components/ui/sidebar"

export default async function ProjectProgressPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()

  if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
    redirect("/login")
  }

  const project = await prisma.project.findFirst({
    where: {
      id,
      ownerId: session.user.ownerId,
    },
  })

  if (!project) {
    redirect("/owner/projects")
  }

  // Fetch tasks for this project
  const tasks = await prisma.task.findMany({
    where: { 
      projectId: project.id,
      ownerId: session.user.ownerId 
    },
    include: {
      project: { select: { id: true, name: true } },
      pic: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // Projects list (only one for this page)
  const projects = [{ id: project.id, name: project.name }]

  // Fetch staff for PIC dropdown
  const staff = await prisma.user.findMany({
    where: { ownerId: session.user.ownerId, role: "STAFF" },
    select: { id: true, username: true },
  })

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen bg-background w-full">
        <Header />
        <main className="container mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/owner/projects/${project.id}`}>
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Progress Proyek</h1>
                <p className="text-muted-foreground">
                  {project.name}
                </p>
              </div>
            </div>
            <AddTaskButton 
              projects={projects} 
              staff={staff} 
              defaultProjectId={project.id} 
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Daftar Pekerjaan
              </CardTitle>
              <CardDescription>
                Total {tasks.length} pekerjaan dalam progress untuk proyek ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Belum ada progress pekerjaan yang dicatat untuk proyek ini.
                </div>
              ) : (
                <TaskList tasks={tasks} projects={projects} staff={staff} />
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  )
}
