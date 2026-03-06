import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { format } from "date-fns"
import { CashflowAddDialog } from "@/components/owner/cashflow-add-dialog"
import { CashflowList } from "@/components/owner/cashflow-list"
import { SidebarProvider } from "@/components/ui/sidebar"

export default async function OwnerCashflowPage() {
  const session = await getSession()

  if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
    redirect("/login")
  }

  // Fetch cashflow transactions
  const cashflows = await prisma.cashflow.findMany({
    where: { ownerId: session.user.ownerId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  // Calculate totals
  const totals = await prisma.cashflow.groupBy({
    by: ["type"],
    where: { ownerId: session.user.ownerId },
    _sum: { amount: true },
  })

  const totalIn = totals.find((t) => t.type === "IN")?._sum.amount || 0
  const totalOut = totals.find((t) => t.type === "OUT")?._sum.amount || 0
  const balance = Number(totalIn) - Number(totalOut)

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen bg-background w-full">
        <Header />
        <main className="container mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Cashflow</h1>
              <p className="text-muted-foreground">
                Kelola transaksi masuk dan keluar
              </p>
            </div>
            <CashflowAddDialog />
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cash In</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  Rp {Number(totalIn).toLocaleString("id-ID")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cash Out</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  Rp {Number(totalOut).toLocaleString("id-ID")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${balance < 0 ? "text-red-600" : ""}`}>
                  Rp {balance.toLocaleString("id-ID")}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Transaksi</CardTitle>
              <CardDescription>
                {cashflows.length} transaksi terakhir
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cashflows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada transaksi
                </div>
              ) : (
                <CashflowList cashflows={cashflows} />
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  )
}
