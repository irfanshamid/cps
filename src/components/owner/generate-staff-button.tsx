"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus } from "lucide-react"
import { toast } from "sonner"

export function GenerateStaffButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState("")
  const [position, setPosition] = useState("")
  const [generated, setGenerated] = useState<{ username: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setCopied(false)

    try {
      const res = await fetch("/api/owner/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, position }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || "Gagal menambahkan staff")
      }
      setGenerated({ username: data.username, password: data.password })
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!generated) return
    const text = `username = ${generated.username}\npassword = ${generated.password}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Credential staff berhasil di-copy!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="mr-2 h-4 w-4" />
        Tambah Staff
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) {
            setGenerated(null)
            setUsername("")
            setPosition("")
            setCopied(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Staff</DialogTitle>
            <DialogDescription>
              Buat akun staff baru. Password akan di-generate otomatis dan bisa Anda copy.
            </DialogDescription>
          </DialogHeader>
          {!generated ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff-username">Username Staff *</Label>
                <Input
                  id="staff-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Masukkan username staff"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-position">Jabatan / Posisi</Label>
                <Input
                  id="staff-position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  disabled={loading}
                  placeholder="Contoh: Mandor, Tukang, Staff Admin"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Memproses..." : "Generate Staff"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg font-mono text-sm space-y-2">
                <div>
                  <span className="text-muted-foreground">username</span> ={" "}
                  <span className="font-bold">{generated.username}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">password</span> ={" "}
                  <span className="font-bold">{generated.password}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCopy} variant="outline" className="flex-1">
                  {copied ? "Copied!" : "Copy Credential"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setGenerated(null)
                    setUsername("")
                    setPosition("")
                    setCopied(false)
                  }}
                >
                  Generate Lagi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

