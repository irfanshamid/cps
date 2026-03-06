
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Loader2, Copy, Check } from "lucide-react"
import { toast } from "sonner"

type User = {
  id: string
  username: string
  role: string
  isActive: boolean
}

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null // If null, it's Add mode
  onSuccess: (result?: any) => void
}

export function UserFormDialog({ open, onOpenChange, user, onSuccess }: UserFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    role: "STAFF",
    password: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        role: user.role,
        password: "", // Password not shown in edit
      })
    } else {
      setFormData({
        username: "",
        role: "STAFF",
        password: "",
      })
    }
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = user ? `/api/admin/users/${user.id}` : "/api/admin/users"
      const method = user ? "PUT" : "POST"
      
      const body: any = {
        username: formData.username,
        role: formData.role,
      }

      if (!user && formData.password) {
        body.password = formData.password
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan user")

      toast.success(user ? "User berhasil diupdate" : "User berhasil dibuat")
      onOpenChange(false)
      onSuccess(data) // Pass data back (might contain credentials)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Tambah User Baru"}</DialogTitle>
          <DialogDescription>
            {user ? "Update informasi user" : "Buat user baru untuk akses sistem"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              disabled={!!user && user.role === 'ADMIN'} // Prevent changing ADMIN role if needed
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!user && (
            <div className="space-y-2">
              <Label htmlFor="password">Password Default (Opsional)</Label>
              <Input
                id="password"
                type="text"
                placeholder="Kosongkan untuk auto-generate"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Jika dikosongkan, password acak akan dibuat.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {user ? "Simpan Perubahan" : "Buat User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onSuccess: (result: any) => void
}

export function ResetPasswordDialog({ open, onOpenChange, user, onSuccess }: ResetPasswordDialogProps) {
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState("")

  useEffect(() => {
    if (open) setNewPassword("")
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Gagal reset password")

      toast.success("Password berhasil direset")
      onOpenChange(false)
      onSuccess(data)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ganti Password</DialogTitle>
          <DialogDescription>
            Set password baru untuk user <b>{user?.username}</b>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Password Baru (Opsional)</Label>
            <Input
              id="newPassword"
              type="text"
              placeholder="Kosongkan untuk auto-generate"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface CredentialsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: { username: string; password?: string } | null
}

export function CredentialsDialog({ open, onOpenChange, data }: CredentialsDialogProps) {
  const [copied, setCopied] = useState(false)

  if (!data) return null

  const textToCopy = `username = ${data.username} | password = ${data.password || "******"}`

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    toast.success("Credential disalin ke clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Kredensial User</DialogTitle>
          <DialogDescription>
            Simpan informasi ini. Password hanya ditampilkan sekali ini saja.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 bg-muted rounded-md space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Username:</span>
            <span className="font-mono">{data.username}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Password:</span>
            <span className="font-mono font-bold">{data.password}</span>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <div className="flex-1 flex justify-center sm:justify-start">
             <code className="text-[10px] text-muted-foreground bg-muted p-1 rounded hidden sm:block">
               {textToCopy}
             </code>
          </div>
          <Button type="button" onClick={handleCopy}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Tersalin" : "Copy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
