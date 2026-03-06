import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/auth.config"
import { UserRole } from "@/types/roles"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
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
                    role: user.role as UserRole,
                    ownerId: user.ownerId,
                    mustCompleteProfile: user.mustCompleteProfile,
                }
            },
        }),
    ],
})
