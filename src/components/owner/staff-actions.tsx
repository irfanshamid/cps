"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoreVertical, Key, Ban, CheckCircle2, Edit } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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

interface StaffActionsProps {
  staffId: string
  username: string
  position?: string
  isActive: boolean
}

export function StaffActions({ staffId, username, position: initialPosition = "", isActive }: StaffActionsProps) {
  const router = useRouter()
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showToggleDialog, setShowToggleDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState(initialPosition)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch(`/api/owner/staff/${staffId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position }),
      })

      if (!response.ok) {
        throw new Error("Gagal update profil staff")
      }

      toast.success("Profil staff berhasil diupdate")
      setShowEditDialog(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/owner/staff/${staffId}/reset-password`, {
        method: "POST",
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Gagal reset password")
      }

      const text = `username = ${username}\npassword = ${data.password}`
      await navigator.clipboard.writeText(text)

      toast.success("Password staff berhasil direset dan credential sudah di-copy!")
      setShowResetDialog(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/owner/staff/${staffId}/toggle-active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Gagal update status staff")
      }

      toast.success(!isActive ? "Staff diaktifkan" : "Staff dinonaktifkan")
      setShowToggleDialog(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowResetDialog(true)}>
            <Key className="mr-2 h-4 w-4" />
            Reset Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowToggleDialog(true)}
            className={isActive ? "text-red-600" : "text-green-600"}
          >
            {isActive ? (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Nonaktifkan Staff
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Aktifkan Staff
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password Staff</AlertDialogTitle>
            <AlertDialogDescription>
              Reset password untuk staff <strong>{username}</strong>? Password baru akan
              di-generate otomatis dan credential akan di-copy ke clipboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword} disabled={loading}>
              {loading ? "Memproses..." : "Reset Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showToggleDialog} onOpenChange={setShowToggleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isActive ? "Nonaktifkan Staff" : "Aktifkan Staff"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin {isActive ? "menonaktifkan" : "mengaktifkan"} staff ini?
              Staff yang nonaktif tidak bisa login ke sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
              disabled={loading}
              className={isActive ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {loading ? "Memproses..." : isActive ? "Nonaktifkan" : "Aktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profil Staff</DialogTitle>
            <DialogDescription>
              Update informasi staff {username}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="position">Jabatan / Posisi</Label>
              <Input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Contoh: Mandor, Tukang"
                disabled={loading}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

