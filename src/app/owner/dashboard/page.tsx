import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { UserRole } from '@/types/roles';
import { prisma } from '@/lib/prisma';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { CashflowChart } from '@/components/owner/dashboard/cashflow-chart';

export default async function OwnerDashboardPage() {
  const session = await getSession();

  // Middleware already protects this route, but we need ownerId for data fetching
  if (!session?.user?.ownerId) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">
              Data Owner Tidak Ditemukan
            </CardTitle>
            <CardDescription>
              Akun Anda tidak terhubung dengan profil Owner yang valid. Silakan
              hubungi administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button variant="outline">Kembali ke Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch owner data
  const owner = await prisma.owner.findUnique({
    where: { id: session.user.ownerId },
  });

  if (!owner) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">
              Profil Tidak Ditemukan
            </CardTitle>
            <CardDescription>
              Profil perusahaan Anda tidak ditemukan di database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/onboarding">
              <Button>Lengkapi Profil</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate cashflow
  const [cashIn, cashOut] = await Promise.all([
    prisma.cashflow.aggregate({
      where: {
        ownerId: session.user.ownerId,
        type: 'IN',
      },
      _sum: { amount: true },
    }),
    prisma.cashflow.aggregate({
      where: {
        ownerId: session.user.ownerId,
        type: 'OUT',
      },
      _sum: { amount: true },
    }),
  ]);

  const totalIn = Number(cashIn._sum.amount || 0);
  const totalOut = Number(cashOut._sum.amount || 0);
  const balance = totalIn - totalOut;

  // Determine status
  let status: 'AMAN' | 'WASPADA' | 'DEFISIT' = 'AMAN';
  let statusColor = 'text-green-600';
  if (balance < 0) {
    status = 'DEFISIT';
    statusColor = 'text-red-600';
  } else if (balance < totalOut * 0.3) {
    status = 'WASPADA';
    statusColor = 'text-yellow-600';
  }

  // Get risky projects
  const riskyProjects = await prisma.project.findMany({
    where: {
      ownerId: session.user.ownerId,
      isOverBudget: true,
    },
    take: 5,
  });

  // Get last 5 cashflow transactions
  const latestCashflows = await prisma.cashflow.findMany({
    where: {
      ownerId: session.user.ownerId,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Get chart data (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch recent transactions for chart
  const recentTransactions = await prisma.cashflow.findMany({
    where: {
      ownerId: session.user.ownerId,
      createdAt: { gte: thirtyDaysAgo },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Transform for chart
  const chartData = recentTransactions.reduce((acc, curr) => {
    const dateStr = curr.createdAt.toISOString().split('T')[0];
    const existing = acc.find((item) => item.date === dateStr);
    const amount = Number(curr.amount);

    if (existing) {
      if (curr.type === 'IN') existing.in += amount;
      else existing.out += amount;
    } else {
      acc.push({
        date: dateStr,
        in: curr.type === 'IN' ? amount : 0,
        out: curr.type === 'OUT' ? amount : 0,
      });
    }
    return acc;
  }, [] as any[]);

  return (
    <div className="min-h-screen bg-background w-full">
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard Cashflow</h1>
          <p className="text-muted-foreground">
            {owner.companyName || 'Dashboard Owner'}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="flex flex-row items-center p-6 gap-4 border border-border/60 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 shrink-0">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-muted-foreground truncate">
                Total Cash In
              </p>
              <h3
                className="text-xl font-bold truncate"
                title={`Rp ${totalIn.toLocaleString('id-ID')}`}
              >
                Rp {totalIn.toLocaleString('id-ID')}
              </h3>
            </div>
          </Card>

          <Card className="flex flex-row items-center p-6 gap-4 border border-border/60 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 shrink-0">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-muted-foreground truncate">
                Total Cash Out
              </p>
              <h3
                className="text-xl font-bold truncate"
                title={`Rp ${totalOut.toLocaleString('id-ID')}`}
              >
                Rp {totalOut.toLocaleString('id-ID')}
              </h3>
            </div>
          </Card>

          <Card className="flex flex-row items-center p-6 gap-4 border border-border/60 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 shrink-0">
              <Wallet className="h-6 w-6" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-muted-foreground truncate">
                Saldo Akhir
              </p>
              <h3
                className={`text-xl font-bold truncate ${balance < 0 ? 'text-red-600' : ''}`}
                title={`Rp ${balance.toLocaleString('id-ID')}`}
              >
                Rp {balance.toLocaleString('id-ID')}
              </h3>
            </div>
          </Card>

          <Card className="flex flex-row items-center p-6 gap-4 border border-border/60 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.03)]">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full shrink-0 ${
                status === 'AMAN'
                  ? 'bg-emerald-100 text-emerald-600'
                  : status === 'WASPADA'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-red-100 text-red-600'
              }`}
            >
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-muted-foreground truncate">
                Status Keuangan
              </p>
              <h3
                className={`text-xl font-bold truncate ${
                  status === 'AMAN'
                    ? 'text-emerald-600'
                    : status === 'WASPADA'
                      ? 'text-amber-600'
                      : 'text-red-600'
                }`}
              >
                {status}
              </h3>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-7 mb-6">
          <div className="col-span-4">
            <CashflowChart data={chartData} />
          </div>
          <div className="col-span-3">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Transaksi Terakhir</CardTitle>
                <Link href="/owner/cashflow">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Lihat Semua <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {latestCashflows.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Belum ada transaksi
                    </p>
                  ) : (
                    latestCashflows.map((cf) => (
                      <div
                        key={cf.id}
                        className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium text-sm truncate max-w-[150px]">
                            {cf.description || cf.category}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(cf.createdAt).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                        <div
                          className={`text-sm font-semibold ${cf.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {cf.type === 'IN' ? '+' : '-'} Rp{' '}
                          {Number(cf.amount).toLocaleString('id-ID')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {riskyProjects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Proyek Berisiko</CardTitle>
              <CardDescription>Proyek dengan over budget</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {riskyProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Budget: Rp{' '}
                        {Number(project.budget).toLocaleString('id-ID')} |
                        Spent: Rp{' '}
                        {Number(project.spent).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
