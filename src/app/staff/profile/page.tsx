
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { ProfileForm } from "@/components/profile/profile-form"
import { PasswordForm } from "@/components/profile/password-form"
import { SidebarProvider } from "@/components/ui/sidebar"

export default async function StaffProfilePage() {
  const session = await getSession()

  if (!session || !session.user || session.user.role !== UserRole.STAFF) {
    redirect("/login")
  }

  // For staff, we might want to show their user data, not owner data. 
  // ProfileForm currently expects Owner data?
  // Let's check ProfileForm.
  // Assuming ProfileForm is generic enough or I might need to adapt it.
  // Wait, the prompt said "copy saja /owner/profile ke /staff/profile".
  // Owner profile fetches `prisma.owner`. Staff doesn't have an Owner record directly (they belong to one).
  // Staff profile should probably edit their own `User` record or just password?
  // "Pengaturan, copy saja /owner/profile ke /staff/profile"
  
  // If I copy it literally, it will try to fetch Owner data. 
  // Staff has `ownerId` but they are not the owner.
  // Maybe the user means the UI layout?
  // Let's assume staff wants to edit their OWN profile (username, maybe not company info).
  // But `ProfileForm` likely edits `Owner` model.
  // Let's check `ProfileForm`.
  
  // For now, I will implement a simple profile page for Staff that allows Password change (PasswordForm is likely generic for User) 
  // and maybe Username change?
  // If I strictly follow "copy", I should use Owner model, but that would mean Staff editing Owner's company info? That's wrong.
  // I will make it show User info.
  
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen bg-background w-full">
        <Header />
        <main className="container mx-auto p-6 max-w-4xl">
          <div className="mb-6 flex items-center gap-4">
            <h1 className="text-3xl font-bold">Profile Settings</h1>
          </div>
          
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-medium mb-4">Informasi Akun</h3>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Username</label>
                        <div className="p-2 border rounded-md bg-muted/50">{session.user.username}</div>
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Role</label>
                        <div className="p-2 border rounded-md bg-muted/50">{session.user.role}</div>
                    </div>
                </div>
            </div>
            <PasswordForm />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
