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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreVertical, Key, Ban, CheckCircle2, Copy } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface UserManagementActionsProps {
  ownerId: string
  userId: string
  username: string
  isBanned: boolean
  isActive: boolean
}

export function UserManagementActions({
  ownerId,
  userId,
  username,
  isBanned,
  isActive,
}: UserManagementActionsProps) {
  const router = useRouter()
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Gagal reset password")
      }

      const data = await response.json()
      
      // Copy to clipboard
      const text = `username = ${username}\npassword = ${data.password}`
      await navigator.clipboard.writeText(text)
      
      toast.success("Password berhasil direset dan credential sudah di-copy!")
      setShowResetDialog(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  const handleBanToggle = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/owners/${ownerId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: !isBanned }),
      })

      if (!response.ok) {
        throw new Error("Gagal update status")
      }

      toast.success(isBanned ? "Owner berhasil di-unban" : "Owner berhasil di-ban")
      setShowBanDialog(false)
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
          <DropdownMenuItem onClick={() => setShowResetDialog(true)}>
            <Key className="mr-2 h-4 w-4" />
            Reset Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowBanDialog(true)}
            className={isBanned ? "text-green-600" : "text-red-600"}
          >
            {isBanned ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Unban Owner
              </>
            ) : (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Ban Owner
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin reset password untuk user <strong>{username}</strong>?
              Password baru akan di-generate otomatis dan credential akan di-copy ke clipboard.
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

      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isBanned ? "Unban Owner" : "Ban Owner"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin {isBanned ? "unban" : "ban"} owner ini?
              {!isBanned && " Owner yang di-ban tidak bisa login ke sistem."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanToggle}
              disabled={loading}
              className={isBanned ? "" : "bg-red-600 hover:bg-red-700"}
            >
              {loading ? "Memproses..." : isBanned ? "Unban" : "Ban"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
