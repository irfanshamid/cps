import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"
import { UserRole } from "@/types/roles"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const session = req.auth
    const pathname = req.nextUrl.pathname
    
    const isAuthPage = pathname.startsWith("/login")
    const isOnboardingPage = pathname.startsWith("/onboarding")
    const isPublicPage = pathname === "/" || pathname.startsWith("/unauthorized")
    const isApiRoute = pathname.startsWith("/api")

    // 1. Let API and Public pages through
    if (isApiRoute || isPublicPage) return NextResponse.next()

    // 2. Unauthenticated
    if (!session) {
        if (isAuthPage) return NextResponse.next()
        return NextResponse.redirect(new URL("/login", req.url))
    }

    // 3. Authenticated on Auth pages
    if (isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // 4. Role-based Route Protection (The most important part)
    if (pathname.startsWith("/admin") && session.user.role !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
    if (pathname.startsWith("/owner") && session.user.role !== UserRole.OWNER) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
    if (pathname.startsWith("/staff") && session.user.role !== UserRole.STAFF) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    // 5. Mandatory Onboarding Check (Only if not already on the page)
    if (session.user.mustCompleteProfile && !isOnboardingPage) {
        return NextResponse.redirect(new URL("/onboarding", req.url))
    }
    if (!session.user.mustCompleteProfile && isOnboardingPage) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|brand.png|favicon.png).*)",
    ],
}
