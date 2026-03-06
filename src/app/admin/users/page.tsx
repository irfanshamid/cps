
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import { UserList } from "@/components/admin/user-list"
import { SidebarProvider } from "@/components/ui/sidebar"

export default async function AdminUsersPage() {
  const session = await getSession()

  if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
    redirect("/login")
  }

  return (
      <div className="min-h-screen bg-background w-full">
        <main className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              Kelola pengguna aplikasi
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Daftar User
              </CardTitle>
              <CardDescription>
                Semua pengguna terdaftar di sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserList />
            </CardContent>
          </Card>
        </main>
      </div>
  )
}
