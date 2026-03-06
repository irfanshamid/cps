
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Users } from "lucide-react"
import Link from "next/link"
import { TeamList } from "@/components/owner/team-list"
import { AddTeamMemberDialog } from "@/components/owner/add-team-member-dialog"
import { AddTeamMemberButton } from "@/components/owner/add-team-member-button"

export default async function ProjectTeamPage({
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

  // Fetch current members
  const members = await prisma.projectTeam.findMany({
    where: { projectId: project.id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          position: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Fetch all staff for adding new members
  const staff = await prisma.user.findMany({
    where: { ownerId: session.user.ownerId, role: "STAFF" },
    select: { id: true, username: true, position: true },
  })

  const existingMemberIds = members.map(m => m.userId)

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
                <h1 className="text-3xl font-bold">Tim Lapangan</h1>
                <p className="text-muted-foreground">
                  {project.name}
                </p>
              </div>
            </div>
            <AddTeamMemberButton 
              projectId={project.id} 
              staff={staff} 
              existingMemberIds={existingMemberIds} 
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Anggota Proyek
              </CardTitle>
              <CardDescription>
                Total {members.length} anggota tim
              </CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Belum ada anggota tim di proyek ini.
                </div>
              ) : (
                <TeamList members={members} projectId={project.id} />
              )}
            </CardContent>
          </Card>
        </main>
      </div>
  )
}
