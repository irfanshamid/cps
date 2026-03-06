import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderKanban, Plus, AlertTriangle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function OwnerProjectsPage() {
  const session = await getSession();

  if (
    !session ||
    !session.user ||
    session.user.role !== UserRole.OWNER ||
    !session.user.ownerId
  ) {
    redirect('/login');
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: session.user.ownerId },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch cashflow data for each project to determine status
  const projectCashflows = await Promise.all(
    projects.map(async (project) => {
        // Calculate Cashflow IN (Termin PAID)
        const paidTermin = await prisma.termin.aggregate({
            where: {
                projectId: project.id,
                status: "PAID"
            },
            _sum: { amount: true }
        })
        const totalIn = Number(paidTermin._sum.amount || 0)

        // Calculate Cashflow OUT
        const cashflowOut = await prisma.cashflow.aggregate({
            where: {
                projectId: project.id,
                type: "OUT"
            },
            _sum: { amount: true }
        })
        const totalOut = Number(cashflowOut._sum.amount || 0)

        const balance = totalIn - totalOut
        const isSafe = balance >= 0

        return {
            projectId: project.id,
            totalIn,
            totalOut,
            balance,
            isSafe
        }
    })
  )

  const cashflowMap = projectCashflows.reduce((acc, curr) => {
      acc[curr.projectId] = curr
      return acc
  }, {} as Record<string, typeof projectCashflows[0]>)


  return (
      <div className="min-h-screen bg-background w-full">
        <main className="container mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Projects</h1>
              <p className="text-muted-foreground">Kelola proyek Anda</p>
            </div>
            <Link href="/owner/projects/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Proyek
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Belum ada proyek</p>
                <Link href="/owner/projects/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Buat Proyek Pertama
                  </Button>
                </Link>
              </div>
            ) : (
              projects.map((project) => {
                const cfStats = cashflowMap[project.id]
                const isSafe = cfStats?.isSafe ?? true

                return (
                  <Link key={project.id} href={`/owner/projects/${project.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="flex-1">{project.name}</CardTitle>
                          {isSafe ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                  <ShieldCheck className="w-3 h-3 mr-1" /> AMAN
                              </Badge>
                          ) : (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
                                  <AlertTriangle className="w-3 h-3 mr-1" /> WARNING
                              </Badge>
                          )}
                        </div>
                        <CardDescription className="line-clamp-2">
                          {project.description || 'Tidak ada deskripsi'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Status Proyek</span>
                          <Badge variant="outline">{project.status}</Badge>
                        </div>
                        
                        <div className="pt-2 border-t">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Cashflow In</span>
                                <span className="font-medium text-green-600">
                                    Rp {cfStats?.totalIn.toLocaleString('id-ID') || 0}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Cashflow Out</span>
                                <span className="font-medium text-red-600">
                                    Rp {cfStats?.totalOut.toLocaleString('id-ID') || 0}
                                </span>
                            </div>
                        </div>

                        {project.startDate && (
                          <div className="text-xs text-muted-foreground pt-2">
                            Mulai:{' '}
                            {format(new Date(project.startDate), 'dd MMM yyyy')}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        </main>
      </div>
  );
}
