
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ListTodo } from "lucide-react"
import { TaskList } from "@/components/owner/task-list"
import { AddTaskButton } from "@/components/owner/add-task-button"

export default async function OwnerProgressPage() {
  const session = await getSession()

  if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
    redirect("/login")
  }

  // Fetch all tasks
  const tasks = await prisma.task.findMany({
    where: { ownerId: session.user.ownerId },
    include: {
      project: { select: { id: true, name: true } },
      pic: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // Fetch projects for dropdown
  const projects = await prisma.project.findMany({
    where: { ownerId: session.user.ownerId },
    select: { id: true, name: true },
  })

  // Fetch staff for PIC dropdown
  const staff = await prisma.user.findMany({
    where: { ownerId: session.user.ownerId, role: "STAFF" },
    select: { id: true, username: true },
  })

  return (
    <div className="min-h-screen bg-background w-full">
      <main className="container mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Management Progress</h1>
            <p className="text-muted-foreground">
              Pantau kemajuan pekerjaan proyek
            </p>
          </div>
          <AddTaskButton projects={projects} staff={staff} />
        </div>

        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Daftar Pekerjaan
              </CardTitle>
              <CardDescription>
                Total {tasks.length} pekerjaan dalam progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Belum ada progress pekerjaan yang dicatat.
                </div>
              ) : (
                <TaskList tasks={tasks} projects={projects} staff={staff} />
              )}
            </CardContent>
          </Card>
        </main>
      </div>
  )
}
