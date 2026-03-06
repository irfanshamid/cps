"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Copy, Check } from "lucide-react"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function GenerateOwnerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<{
    username: string
    password: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
  })

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setCopied(false)

    try {
      const response = await fetch("/api/admin/users/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Gagal generate owner")
      }

      const data = await response.json()
      setGenerated({
        username: data.username,
        password: data.password,
      })
      toast.success("Owner berhasil di-generate!")
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
    toast.success("Credential berhasil di-copy!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen bg-background w-full">
        <Header />
        <main className="container mx-auto p-6 max-w-2xl">
          <div className="mb-6">
          <h1 className="text-3xl font-bold">Generate Owner Baru</h1>
          <p className="text-muted-foreground">
            Buat akun owner baru untuk platform
          </p>
        </div>

        {!generated ? (
          <Card>
            <CardHeader>
              <CardTitle>Form Generate Owner</CardTitle>
              <CardDescription>
                Masukkan username untuk owner baru. Password akan di-generate otomatis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    required
                    disabled={loading}
                    placeholder="Masukkan username"
                  />
                  <p className="text-xs text-muted-foreground">
                    Username harus unik dan tidak boleh mengandung spasi
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Owner"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Owner Berhasil Di-generate!</CardTitle>
              <CardDescription>
                Simpan credential ini dengan aman. Owner harus login dan complete profile sebelum bisa menggunakan sistem.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Button onClick={handleCopy} className="flex-1" variant="outline">
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Credential
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setGenerated(null)
                    setFormData({ username: "" })
                  }}
                  variant="outline"
                >
                  Generate Lagi
                </Button>
                <Button onClick={() => router.push("/admin/users")}>
                  Kembali ke List
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
    </SidebarProvider>
  )
}
