
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ListTodo, ArrowRight } from "lucide-react"
import Link from "next/link"
import { ProgressChart } from "@/components/staff/dashboard/progress-chart"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Progress } from "@/components/ui/progress"

export default async function StaffDashboardPage() {
  const session = await getSession()

  if (!session || !session.user || session.user.role !== UserRole.STAFF) {
    redirect("/login")
  }

  // Fetch my tasks (top 5 by deadline)
  const myTasks = await prisma.task.findMany({
    where: { picId: session.user.id },
    include: {
      project: { select: { name: true } },
    },
    orderBy: { deadline: "asc" },
    take: 5,
  })

  // Calculate average progress per project
  const allMyTasks = await prisma.task.findMany({
    where: { picId: session.user.id },
    select: {
      progress: true,
      project: { select: { name: true } },
    },
  })

  const progressByProject: Record<string, { total: number; count: number }> = {}

  allMyTasks.forEach((task) => {
    const projectName = task.project.name
    if (!progressByProject[projectName]) {
      progressByProject[projectName] = { total: 0, count: 0 }
    }
    progressByProject[projectName].total += task.progress
    progressByProject[projectName].count += 1
  })

  const chartData = Object.entries(progressByProject).map(([projectName, stats]) => ({
    projectName,
    avgProgress: Math.round(stats.total / stats.count),
  }))

  return (
      <div className="min-h-screen bg-background w-full">
        <main className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Selamat datang kembali, {session.user.username}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-6">
            <ProgressChart data={chartData} />
            
            <Card className="col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tugas Saya</CardTitle>
                <Link href="/staff/tasks">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Lihat Semua <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Tidak ada tugas aktif
                    </p>
                  ) : (
                    myTasks.map((task) => (
                      <div key={task.id} className="border-b pb-3 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <p className="font-medium text-sm line-clamp-1">{task.title}</p>
                            <p className="text-xs text-muted-foreground">{task.project.name}</p>
                          </div>
                          <span className="text-xs font-medium bg-secondary px-2 py-1 rounded-full">
                            {task.progress}%
                          </span>
                        </div>
                        <Progress value={task.progress} className="h-1.5" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
  )
}
