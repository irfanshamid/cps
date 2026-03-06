import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { Header } from '@/components/layout/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Edit, Trash2, ArrowRight, ShieldCheck, ListTodo, Users } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ProjectActions } from '@/components/owner/project-actions';
import { SidebarProvider } from "@/components/ui/sidebar"

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (
    !session ||
    !session.user ||
    session.user.role !== UserRole.OWNER ||
    !session.user.ownerId
  ) {
    redirect('/login');
  }

  const project = await prisma.project.findFirst({
    where: {
      id,
      ownerId: session.user.ownerId,
    },
  });

  if (!project) {
    redirect('/owner/projects');
  }

  // Aggregate RAB Items
  const rabSummary = await prisma.rAB.aggregate({
    where: {
      projectId: project.id,
      ownerId: session.user.ownerId,
    },
    _sum: {
      budget: true,
      spent: true,
    },
  });

  // Aggregate Cashflow OUT Items
  const cashflowSummary = await prisma.cashflow.aggregate({
    where: {
      projectId: project.id,
      ownerId: session.user.ownerId,
      type: 'OUT',
    },
    _sum: {
      amount: true,
      budget: true,
    },
  });

  // Calculate Cashflow IN (Termin PAID) for AMAN/WARNING status
  const paidTermin = await prisma.termin.aggregate({
      where: {
          projectId: project.id,
          status: "PAID"
      },
      _sum: { amount: true }
  })
  const totalIn = Number(paidTermin._sum.amount || 0)
  const totalOut = Number(cashflowSummary._sum.amount || 0)
  const balance = totalIn - totalOut
  const isSafe = balance >= 0

  const budget = Number(project.budget);

  // Total RAB = RAB Items Budget + Cashflow Items Budget (if any)
  const totalRab =
    Number(rabSummary._sum.budget || 0) +
    Number(cashflowSummary._sum.budget || 0);

  // Total Realisasi = RAB Items Spent + Cashflow Items Amount (Realization)
  const totalReal =
    Number(rabSummary._sum.spent || 0) +
    Number(cashflowSummary._sum.amount || 0);

  const remaining = budget - totalReal;
  const percentage = budget > 0 ? (totalReal / budget) * 100 : 0;
  const isOverBudget = totalReal > budget || totalRab > budget;

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen bg-background w-full">
        <Header />
        <main className="container mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{project.name}</h1>
                  {isSafe ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                          <ShieldCheck className="w-4 h-4 mr-1" /> AMAN
                      </Badge>
                  ) : (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
                          <AlertTriangle className="w-4 h-4 mr-1" /> WARNING
                      </Badge>
                  )}
              </div>
              <p className="text-muted-foreground mt-1">Detail proyek</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/owner/projects/${project.id}/edit`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <ProjectActions projectId={project.id} projectName={project.name} />
            </div>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <Link href={`/owner/projects/${project.id}/cashflow`}>
              <Card className="hover:shadow-lg transition-all cursor-pointer bg-blue-50 border-blue-100 hover:bg-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-center text-blue-700">
                      Cashflow
                      <ArrowRight className="h-5 w-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-600/80">
                    Lihat transaksi & arus kas
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/owner/projects/${project.id}/rab`}>
              <Card className="hover:shadow-lg transition-all cursor-pointer bg-orange-50 border-orange-100 hover:bg-orange-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-center text-orange-700">
                      RAB
                      <ArrowRight className="h-5 w-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-orange-600/80">
                    Kelola Rencana Anggaran Biaya
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/owner/projects/${project.id}/termin`}>
              <Card className="hover:shadow-lg transition-all cursor-pointer bg-purple-50 border-purple-100 hover:bg-purple-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-center text-purple-700">
                      Termin
                      <ArrowRight className="h-5 w-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-purple-600/80">
                    Kelola jadwal pembayaran
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/owner/projects/${project.id}/progress`}>
              <Card className="hover:shadow-lg transition-all cursor-pointer bg-emerald-50 border-emerald-100 hover:bg-emerald-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-center text-emerald-700">
                      Progress
                      <ArrowRight className="h-5 w-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-emerald-600/80">
                    Update progress pekerjaan
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/owner/projects/${project.id}/teams`}>
              <Card className="hover:shadow-lg transition-all cursor-pointer bg-indigo-50 border-indigo-100 hover:bg-indigo-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-center text-indigo-700">
                      Tim Lapangan
                      <ArrowRight className="h-5 w-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-indigo-600/80">
                    Kelola anggota proyek
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Proyek</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className="mt-1">{project.status}</Badge>
                </div>
                {project.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Deskripsi</p>
                    <p className="mt-1">{project.description}</p>
                  </div>
                )}
                {project.startDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal Mulai</p>
                    <p className="mt-1">
                      {format(new Date(project.startDate), 'dd MMMM yyyy')}
                    </p>
                  </div>
                )}
                {project.endDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Tanggal Selesai
                    </p>
                    <p className="mt-1">
                      {format(new Date(project.endDate), 'dd MMMM yyyy')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Budget & Spending
                  {isOverBudget && (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Budget</span>
                    <span className="font-medium">
                      Rp {budget.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total RAB
                    </span>
                    <span className="font-medium">
                      Rp {totalRab.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Realisasi
                    </span>
                    <span
                      className={`font-medium ${
                        isOverBudget ? 'text-red-600' : ''
                      }`}
                    >
                      Rp {totalReal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Remaining
                    </span>
                    <span
                      className={`font-medium ${
                        remaining < 0 ? 'text-red-600' : ''
                      }`}
                    >
                      Rp {remaining.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-primary/10 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      isOverBudget ? 'bg-red-600' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {percentage.toFixed(1)}% dari budget digunakan
                  {isOverBudget && (
                    <span className="text-red-600 block mt-1">
                      ⚠️ Over budget!
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
