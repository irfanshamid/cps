import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, ChevronLeft } from "lucide-react"
import { format } from "date-fns"
import { CashflowAddDialog } from "@/components/owner/cashflow-add-dialog"
import { CashflowList } from "@/components/owner/cashflow-list"
import Link from "next/link"

export default async function ProjectCashflowPage({
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

  // Cashflow IN = total termin berstatus PAID
  const paidTermin = await prisma.termin.aggregate({
    where: {
      projectId: project.id,
      ownerId: session.user.ownerId,
      status: "PAID",
    },
    _sum: { amount: true },
  })

  const totalIn = Number(paidTermin._sum.amount || 0)

  // Cashflow OUT = transaksi cashflow OUT untuk project ini
  const cashflowOutAgg = await prisma.cashflow.aggregate({
    where: {
      projectId: project.id,
      ownerId: session.user.ownerId,
      type: "OUT",
    },
    _sum: { amount: true },
  })

  const totalOut = Number(cashflowOutAgg._sum.amount || 0)
  const balance = totalIn - totalOut
  const isDeficit = balance < 0

  const cashflows = await prisma.cashflow.findMany({
    where: {
      projectId: project.id,
      ownerId: session.user.ownerId,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-background w-full">
      <main className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
              <Link href={`/owner/projects/${project.id}`}>
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Cashflow Proyek</h1>
                <p className="text-muted-foreground">
                  {project.name}
                </p>
              </div>
            </div>
            <CashflowAddDialog defaultProjectId={project.id} />
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cashflow In</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                Rp {totalIn.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground">
                Dari termin berstatus PAID
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cashflow Out</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                Rp {totalOut.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground">
                Pengeluaran yang tercatat di cashflow
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isDeficit ? "text-red-600" : ""}`}>
                Rp {balance.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground">
                {isDeficit ? "Defisit (Out lebih besar dari In)" : "Masih aman (In ≥ Out)"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Cashflow Proyek</CardTitle>
            <CardDescription>
              Transaksi masuk/keluar yang dikaitkan dengan proyek ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cashflows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada transaksi cashflow untuk proyek ini
              </div>
            ) : (
              <CashflowList cashflows={cashflows} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

