import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    throw new Error("Username dan password wajib diisi")
                }

                const user = await prisma.user.findUnique({
                    where: { username: credentials.username as string },
                    include: {
                        owner: true,
                    },
                })

                if (!user || !user.isActive) {
                    throw new Error("User tidak ditemukan atau tidak aktif")
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                )

                if (!isPasswordValid) {
                    throw new Error("Password salah")
                }

                return {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    ownerId: user.ownerId,
                    mustCompleteProfile: user.mustCompleteProfile,
                }
            },
        }),
    ],
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
        async session({ session, token }) {
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
    pages: {
        signIn: "/login",
        error: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
})
