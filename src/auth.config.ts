import type { NextAuthConfig } from "next-auth"
import { UserRole } from "@/types/roles"

export const authConfig = {
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }: any) {
            if (user) {
                token.id = user.id
                token.username = user.username
                token.role = user.role
                token.ownerId = user.ownerId
                token.mustCompleteProfile = user.mustCompleteProfile
            }

            if (trigger === "update" && session) {
                if (typeof session.mustCompleteProfile === "boolean") {
                    token.mustCompleteProfile = session.mustCompleteProfile
                }
            }

            return token
        },
        async session({ session, token }: any) {
            if (token) {
                session.user = {
                    id: token.id as string,
                    username: token.username as string,
                    role: token.role as UserRole,
                    ownerId: token.ownerId as string | null,
                    mustCompleteProfile: token.mustCompleteProfile as boolean,
                }
            }
            return session
        },
    },
    providers: [], // Empty providers array for Edge compatibility
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig
