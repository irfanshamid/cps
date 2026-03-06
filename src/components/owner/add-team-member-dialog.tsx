
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

type StaffOption = {
  id: string
  username: string
  position?: string | null
}

type AddTeamMemberDialogProps = {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: StaffOption[]
  existingMemberIds: string[]
}

export function AddTeamMemberDialog({ 
  projectId, 
  open, 
  onOpenChange, 
  staff, 
  existingMemberIds 
}: AddTeamMemberDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState("")
  const [role, setRole] = useState("")

  const availableStaff = staff.filter(s => !existingMemberIds.includes(s.id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) {
      toast.error("Staff wajib dipilih")
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/owner/projects/${projectId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          role,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || "Gagal menambahkan anggota")
      }

      toast.success("Anggota berhasil ditambahkan")
      setUserId("")
      setRole("")
      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Anggota Tim</DialogTitle>
          <DialogDescription>
            Pilih staff untuk ditambahkan ke proyek ini.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Staff</Label>
            <Select
              value={userId}
              onValueChange={setUserId}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih staff" />
              </SelectTrigger>
              <SelectContent>
                {availableStaff.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Tidak ada staff tersedia (semua sudah masuk tim)
                  </div>
                ) : (
                  availableStaff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.username} {s.position ? `(${s.position})` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Peran di Proyek (Opsional)</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Contoh: Pengawas Lapangan"
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || availableStaff.length === 0}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menambahkan...
              </>
            ) : (
              "Tambah"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
