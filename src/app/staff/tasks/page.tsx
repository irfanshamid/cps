
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ListTodo } from "lucide-react"
import { StaffTaskList } from "@/components/staff/staff-task-list"
import { SidebarProvider } from "@/components/ui/sidebar"

export default async function StaffTasksPage() {
  const session = await getSession()

  if (!session || !session.user || session.user.role !== UserRole.STAFF) {
    redirect("/login")
  }

  // Fetch all tasks for this staff
  const tasks = await prisma.task.findMany({
    where: { picId: session.user.id },
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: { deadline: "asc" },
  })

  // Get unique project names for filter
  const projectNames = Array.from(new Set(tasks.map(t => t.project.name)))

  return (
      <div className="min-h-screen bg-background w-full">
        <main className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Tugas Saya</h1>
            <p className="text-muted-foreground">
              Daftar pekerjaan yang ditugaskan kepada Anda
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Daftar Tugas
              </CardTitle>
              <CardDescription>
                Total {tasks.length} tugas aktif
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StaffTaskList tasks={tasks} projects={projectNames} />
            </CardContent>
          </Card>
        </main>
      </div>
  )
}
