
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, User } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type Member = {
  id: string // ProjectTeam ID
  userId: string
  role: string | null
  user: {
    id: string
    username: string
    position: string | null
  }
}

interface TeamListProps {
  members: Member[]
  projectId: string
}

export function TeamList({ members, projectId }: TeamListProps) {
  const router = useRouter()
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingUserId) return

    try {
      const response = await fetch(`/api/owner/projects/${projectId}/teams?userId=${deletingUserId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Gagal menghapus anggota")
      }

      toast.success("Anggota berhasil dihapus dari tim")
      router.refresh()
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus")
    } finally {
      setDeletingUserId(null)
    }
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(member.user.username)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{member.user.username}</p>
                <p className="text-sm text-muted-foreground">
                  {member.role || member.user.position || "Anggota Tim"}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeletingUserId(member.userId)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deletingUserId} onOpenChange={(open) => !open && setDeletingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Anggota?</AlertDialogTitle>
            <AlertDialogDescription>
              Anggota ini akan dihapus dari tim proyek. Data staff tidak akan terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
