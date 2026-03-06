"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

type ProjectOption = {
  id: string
  name: string
}

type CashflowAddDialogProps = {
  defaultProjectId?: string
}

const DEFAULT_CATEGORIES = [
  "Pekerjaan Persiapan",
  "Pekerjaan Struktur",
  "Pekerjaan Arsitektur",
  "Pekerjaan ME / MEP",
  "Pekerjaan Finishing",
  "Material",
  "Upah / Gaji",
  "Sewa Alat",
  "Operasional",
  "Lainnya",
]

export function CashflowAddDialog({ defaultProjectId }: CashflowAddDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [form, setForm] = useState({
    projectId: defaultProjectId ?? "none",
    category: "",
    itemName: "",
    quantity: "1",
    unit: "",
    unitPrice: "",
  })

  const qty = Number(form.quantity) || 0
  const unitPrice = Number(form.unitPrice) || 0
  const total = qty * unitPrice

  useEffect(() => {
    if (!open || defaultProjectId) return

    fetch("/api/owner/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProjects(data.projects || [])
        }
      })
      .catch(() => {
        toast.error("Gagal memuat daftar proyek")
      })
  }, [open, defaultProjectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qty || !unitPrice) {
      toast.error("Qty dan harga per qty wajib diisi")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/owner/cashflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "OUT",
          amount: total,
          description: form.itemName,
          category: form.category || undefined,
          quantity: qty,
          unit: form.unit || undefined,
          projectId:
            defaultProjectId ??
            (form.projectId && form.projectId !== "none" ? form.projectId : null),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || "Gagal menambah transaksi")
      }

      toast.success("Transaksi cashflow OUT berhasil ditambahkan")
      setForm({
        projectId: defaultProjectId ?? "none",
        category: "",
        itemName: "",
        quantity: "1",
        unit: "",
        unitPrice: "",
      })
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!loading) setOpen(v)
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Cashflow OUT
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Cashflow Pengeluaran</DialogTitle>
          <DialogDescription>
            Catat pengeluaran proyek. Total realisasi akan dihitung otomatis dari qty dan harga
            per qty.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!defaultProjectId && (
            <div className="space-y-2">
              <Label>Proyek</Label>
              <Select
                value={form.projectId}
                onValueChange={(value) => setForm((f) => ({ ...f, projectId: value }))}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih proyek (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada proyek</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select
              value={form.category || "none"}
              onValueChange={(value) =>
                setForm((f) => ({
                  ...f,
                  category: value === "none" ? "" : value,
                }))
              }
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih kategori atau kosongkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa kategori</SelectItem>
                {DEFAULT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cf-item">Nama Item *</Label>
            <Input
              id="cf-item"
              value={form.itemName}
              onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
              required
              disabled={loading}
              placeholder="Contoh: Pembelian besi, upah tukang"
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-2 col-span-1">
              <Label htmlFor="cf-qty">Qty *</Label>
              <Input
                id="cf-qty"
                type="number"
                min="0.01"
                step="0.01"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2 col-span-1">
              <Label htmlFor="cf-unit">Unit</Label>
              <Input
                id="cf-unit"
                placeholder="Unit"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="cf-unit-price">Harga per Qty *</Label>
              <Input
                id="cf-unit-price"
                type="number"
                min="0"
                step="1000"
                value={form.unitPrice}
                onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <span className="text-muted-foreground">Total Pengeluaran (Realisasi)</span>
            <div className="text-xl font-semibold">
              Rp {Number.isFinite(total) ? total.toLocaleString("id-ID") : 0}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Cashflow OUT"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

