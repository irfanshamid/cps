import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"
import { UserRole } from "@/types/roles"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const session = req.auth
    const pathname = req.nextUrl.pathname

    if (!session) {
        return NextResponse.redirect(new URL("/login", req.url))
    }

    // Check if user needs to complete profile (OWNER only)
    if (
        session.user.role === UserRole.OWNER &&
        session.user.mustCompleteProfile &&
        !pathname.startsWith("/onboarding")
    ) {
        return NextResponse.redirect(new URL("/onboarding", req.url))
    }

    // Role-based route protection
    if (pathname.startsWith("/admin")) {
        if (session.user.role !== UserRole.ADMIN) {
            return NextResponse.redirect(new URL("/unauthorized", req.url))
        }
    }

    if (pathname.startsWith("/owner")) {
        if (session.user.role !== UserRole.OWNER) {
            return NextResponse.redirect(new URL("/unauthorized", req.url))
        }
        // Owner must complete profile first
        if (session.user.mustCompleteProfile) {
            return NextResponse.redirect(new URL("/onboarding", req.url))
        }
    }

    if (pathname.startsWith("/staff")) {
        if (session.user.role !== UserRole.STAFF) {
            return NextResponse.redirect(new URL("/unauthorized", req.url))
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        "/admin/:path*",
        "/owner/:path*",
        "/staff/:path*",
        "/onboarding/:path*",
    ],
}
