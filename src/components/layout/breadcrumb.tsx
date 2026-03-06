
"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { Fragment } from "react"

const breadcrumbNameMap: Record<string, string> = {
  owner: "Owner",
  dashboard: "Dashboard",
  cashflow: "Cashflow",
  projects: "Proyek",
  staff: "Tim / Staff",
  settings: "Pengaturan",
  rab: "RAB",
  termin: "Termin",
  new: "Baru",
}

export function Breadcrumb() {
  const pathname = usePathname()
  const pathnames = pathname.split("/").filter((x) => x)

  // Remove the first segment if it's 'owner' since it's implied by the layout context or handled differently
  // Actually, keeping 'Owner' as root is fine, but usually we might want Home > Dashboard
  // Let's stick to simple path mapping for now.

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center text-sm text-muted-foreground">
      <Link href="/owner/dashboard" className="flex items-center hover:text-foreground transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      {pathnames.map((value, index) => {
        const isLast = index === pathnames.length - 1
        const to = `/${pathnames.slice(0, index + 1).join("/")}`
        const name = breadcrumbNameMap[value] || value

        // Skip rendering "owner" if you want "Home" to represent dashboard root
        if (value === "owner" && index === 0) return null

        return (
          <Fragment key={to}>
            <ChevronRight className="mx-2 h-4 w-4" />
            {isLast ? (
              <span className="font-medium text-foreground capitalize">{name}</span>
            ) : (
              <Link href={to} className="hover:text-foreground transition-colors capitalize">
                {name}
              </Link>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
