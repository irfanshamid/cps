import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { TerminAddDialog } from "@/components/owner/termin-add-dialog"
import { TerminList } from "@/components/owner/termin-list"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default async function TerminPage({
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

  const termins = await prisma.termin.findMany({
    where: {
      projectId: project.id,
      ownerId: session.user.ownerId,
    },
    orderBy: { dueDate: "asc" },
  })

  return (
    <div className="min-h-screen bg-background w-full">
      <main className="container mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
              <Link href={`/owner/projects/${project.id}`}>
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Termin Pembayaran</h1>
                <p className="text-muted-foreground">
                  {project.name} - Jadwal Pembayaran
                </p>
              </div>
            </div>
            <TerminAddDialog projectId={project.id} />
          </div>

          {termins.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <p className="text-muted-foreground">Belum ada jadwal termin untuk proyek ini.</p>
                <TerminAddDialog projectId={project.id} />
              </CardContent>
            </Card>
          ) : (
            <TerminList termins={termins} projectId={project.id} />
          )}
        </main>
      </div>
  )
}
