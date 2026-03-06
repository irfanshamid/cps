import { UserRole } from "@prisma/client"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            username: string
            role: UserRole
            ownerId: string | null
            mustCompleteProfile: boolean
        } & DefaultSession["user"]
    }

    interface User {
        id: string
        username: string
        role: UserRole
        ownerId: string | null
        mustCompleteProfile: boolean
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        username: string
        role: UserRole
        ownerId: string | null
        mustCompleteProfile: boolean
    }
}
