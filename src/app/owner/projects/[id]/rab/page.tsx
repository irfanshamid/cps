
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { RabAddDialog } from "@/components/owner/rab-add-dialog"
import { RABTable } from "@/components/owner/rab-table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Download } from "lucide-react"
import Link from "next/link"

export default async function RABPage({
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

  const rabs = await prisma.rAB.findMany({
    where: {
      projectId: project.id,
      ownerId: session.user.ownerId,
    },
    orderBy: [
      { category: "asc" },
      { createdAt: "asc" },
    ],
  })

  const cashflows = await prisma.cashflow.findMany({
    where: {
      projectId: project.id,
      ownerId: session.user.ownerId,
      type: "OUT",
    },
    orderBy: { createdAt: "asc" },
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
                <h1 className="text-3xl font-bold">Draft RAB</h1>
                <p className="text-muted-foreground">
                  {project.name} - Rencana Anggaran Biaya Proyek
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <a href={`/api/owner/projects/${project.id}/rab/export`}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Excel
                </a>
              </Button>
              <RabAddDialog projectId={project.id} />
            </div>
          </div>

          {rabs.length === 0 && cashflows.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <p className="text-muted-foreground">Belum ada item RAB atau pengeluaran untuk proyek ini.</p>
                <RabAddDialog projectId={project.id} />
              </CardContent>
            </Card>
          ) : (
            <RABTable rabs={rabs} cashflows={cashflows} />
          )}
        </main>
      </div>
  )
}
