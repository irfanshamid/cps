
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HardHat, ArrowRight, Users } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default async function OwnerTeamsPage() {
  const session = await getSession()

  if (!session || !session.user || session.user.role !== UserRole.OWNER || !session.user.ownerId) {
    redirect("/login")
  }

  // Fetch projects with their team members
  const projects = await prisma.project.findMany({
    where: { ownerId: session.user.ownerId },
    include: {
      teams: {
        include: {
          user: {
            select: { username: true }
          }
        },
        take: 5 // Show first 5 members
      },
      _count: {
        select: { teams: true }
      }
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-background w-full">
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Tim Lapangan</h1>
          <p className="text-muted-foreground">
            Kelola penugasan staff ke proyek
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>
                    {project._count.teams} anggota tim
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  {project.teams.length > 0 ? (
                    <div className="flex -space-x-2 overflow-hidden mb-4">
                      {project.teams.map((member) => (
                        <Avatar key={member.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background border">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(member.user.username)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {project._count.teams > 5 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-background bg-muted text-xs font-medium">
                          +{project._count.teams - 5}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground mb-4">
                      Belum ada anggota tim
                    </div>
                  )}
                  
                  <Link href={`/owner/projects/${project.id}/teams`} className="mt-auto">
                    <Button variant="outline" className="w-full">
                      <Users className="mr-2 h-4 w-4" />
                      Kelola Tim
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}

            {projects.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Belum ada proyek. Silakan buat proyek terlebih dahulu.
              </div>
            )}
          </div>
      </main>
    </div>
  )
}
