"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { ProjectStatus } from "@prisma/client"

type ProjectResponse = {
  success: boolean
  project?: {
    id: string
    name: string
    description: string | null
    status: ProjectStatus
    startDate: string | null
    endDate: string | null
    budget: string | number
  }
  message?: string
}

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const projectId = params?.id

  const [loading, setLoading] = useState(false)
  const [loadingProject, setLoadingProject] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "PLANNING" as ProjectStatus,
    startDate: "",
    endDate: "",
    budget: "",
  })

  useEffect(() => {
    if (!projectId) return

    setLoadingProject(true)
    fetch(`/api/owner/projects/${projectId}`)
      .then((res) => res.json() as Promise<ProjectResponse>)
      .then((data) => {
        if (!data.success || !data.project) {
          throw new Error(data.message || "Gagal memuat proyek")
        }

        setFormData({
          name: data.project.name ?? "",
          description: data.project.description ?? "",
          status: data.project.status ?? "PLANNING",
          startDate: data.project.startDate ? data.project.startDate.slice(0, 10) : "",
          endDate: data.project.endDate ? data.project.endDate.slice(0, 10) : "",
          budget: String(data.project.budget ?? ""),
        })
      })
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : "Gagal memuat proyek"
        toast.error(errorMessage)
        router.replace("/owner/projects")
      })
      .finally(() => setLoadingProject(false))
  }, [projectId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/owner/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          status: formData.status,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          budget: parseFloat(formData.budget) || 0,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean
        message?: string
      }

      if (!response.ok) {
        throw new Error(data.message || "Gagal menyimpan perubahan proyek")
      }

      toast.success("Proyek berhasil diupdate!")
      router.push(`/owner/projects/${projectId}`)
      router.refresh()
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Terjadi kesalahan"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Edit Proyek</h1>
          <p className="text-muted-foreground">Perbarui informasi proyek Anda</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Proyek</CardTitle>
            <CardDescription>Ubah data proyek dan simpan</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProject ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Proyek *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={loading}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value as ProjectStatus })
                      }
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PLANNING">Planning</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (Rp) *</Label>
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Tanggal Mulai</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Tanggal Selesai</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Perubahan"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
