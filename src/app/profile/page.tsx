
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { ProfileForm } from "@/components/profile/profile-form"
import { PasswordForm } from "@/components/profile/password-form"
import { SidebarProvider } from "@/components/ui/sidebar"

import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ProfilePage() {
  const session = await getSession()

  if (!session || !session.user) {
    redirect("/login")
  }

  let ownerData = null

  if (session.user.role === UserRole.OWNER && session.user.ownerId) {
    ownerData = await prisma.owner.findUnique({
      where: { id: session.user.ownerId },
    })
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen bg-background w-full">
        <Header />
        <main className="container mx-auto p-6 max-w-4xl">
          <div className="mb-6 flex items-center gap-4">
            <h1 className="text-3xl font-bold">Profile Settings</h1>
          </div>
          
          {session.user.role === UserRole.OWNER ? (
            <div className="space-y-6">
              <ProfileForm initialData={ownerData} />
              <PasswordForm />
            </div>
          ) : (
            <div className="p-4 border rounded-md bg-muted/50 text-center">
              <p className="text-muted-foreground">
                Profile editing is currently only available for Owner accounts.
              </p>
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  )
}
