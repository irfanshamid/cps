import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { UserRole } from "@prisma/client"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session || !session.user) {
    redirect("/login")
  }

  // Redirect berdasarkan role
  switch (session.user.role) {
    case UserRole.ADMIN:
      redirect("/admin/dashboard")
    case UserRole.OWNER:
      if (session.user.mustCompleteProfile) {
        redirect("/onboarding")
      }
      redirect("/owner/dashboard")
    case UserRole.STAFF:
      redirect("/staff/dashboard")
    default:
      redirect("/login")
  }
}
