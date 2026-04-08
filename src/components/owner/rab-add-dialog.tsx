
"use client"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

type RabAddDialogProps = {
  projectId: string
}

const DEFAULT_CATEGORIES = [
  "Pekerjaan Persiapan",
  "Pekerjaan Struktur",
  "Pekerjaan Arsitektur",
  "Pekerjaan ME / MEP",
  "Pekerjaan Finishing",
  "Lainnya",
]

export function RabAddDialog({ projectId }: RabAddDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const MAX_MONEY = 999999999999999.99
  const MAX_QTY = 99999999.99
  const [form, setForm] = useState({
    category: "",
    name: "",
    description: "",
    quantity: "1",
    unit: "",
    frequency: "",
    unitPrice: "",      // New field
    budget: "",
    realUnitPrice: "",  // New field
    realAmount: "",
    remarks: "",
  })

  // Handlers for auto-calculation
  const updateCalculations = (field: string, val: string) => {
    const newForm = { ...form, [field]: val }
    const qty = parseFloat(field === 'quantity' ? val : form.quantity) || 0
    
    if (field === 'quantity') {
      const price = parseFloat(form.unitPrice) || 0
      const realPrice = parseFloat(form.realUnitPrice) || 0
      newForm.budget = (qty * price).toString()
      newForm.realAmount = (qty * realPrice).toString()
    } else if (field === 'unitPrice') {
      const price = parseFloat(val) || 0
      newForm.budget = (qty * price).toString()
    } else if (field === 'realUnitPrice') {
      const realPrice = parseFloat(val) || 0
      newForm.realAmount = (qty * realPrice).toString()
    } else if (field === 'budget') {
      const budget = parseFloat(val) || 0
      if (qty > 0) newForm.unitPrice = (budget / qty).toString()
    } else if (field === 'realAmount') {
      const realAmount = parseFloat(val) || 0
      if (qty > 0) newForm.realUnitPrice = (realAmount / qty).toString()
    }

    setForm(newForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const qty = Number(form.quantity) || 0
      const budget = Number(form.budget) || 0
      const unitPrice = Number(form.unitPrice) || 0
      const realUnitPrice = Number(form.realUnitPrice) || 0
      const realAmount = form.realAmount ? Number(form.realAmount) : 0

      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error("Qty tidak valid")
      }
      if (qty > MAX_QTY) {
        throw new Error("Qty terlalu besar (maksimum 99.999.999,99)")
      }
      if (!Number.isFinite(budget) || budget < 0) {
        throw new Error("Total Budget (RAB) tidak valid")
      }
      if (budget > MAX_MONEY) {
        throw new Error("Total Budget (RAB) terlalu besar (maksimum Rp 999.999.999.999.999,99)")
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error("Harga Satuan (RAB) tidak valid")
      }
      if (unitPrice > MAX_MONEY) {
        throw new Error("Harga Satuan (RAB) terlalu besar (maksimum Rp 999.999.999.999.999,99)")
      }
      if (!Number.isFinite(realUnitPrice) || realUnitPrice < 0) {
        throw new Error("Harga Satuan (Realistis) tidak valid")
      }
      if (realUnitPrice > MAX_MONEY) {
        throw new Error("Harga Satuan (Realistis) terlalu besar (maksimum Rp 999.999.999.999.999,99)")
      }
      if (!Number.isFinite(realAmount) || realAmount < 0) {
        throw new Error("Total Realistis tidak valid")
      }
      if (realAmount > MAX_MONEY) {
        throw new Error("Total Realistis terlalu besar (maksimum Rp 999.999.999.999.999,99)")
      }

      const res = await fetch(`/api/owner/projects/${projectId}/rab`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          category: form.category || DEFAULT_CATEGORIES[0],
          quantity: qty,
          unit: form.unit || undefined,
          frequency: form.frequency || undefined,
          budget,
          unitPrice,
          realUnitPrice,
          realAmount: form.realAmount ? realAmount : undefined,
          remarks: form.remarks || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || "Gagal menambah item RAB")
      }

      toast.success("Item RAB berhasil ditambahkan")
      setForm({
        category: "",
        name: "",
        description: "",
        quantity: "1",
        unit: "",
        frequency: "",
        unitPrice: "",
        budget: "",
        realUnitPrice: "",
        realAmount: "",
        remarks: "",
      })
      setOpen(false)
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
    <Dialog open={open} onOpenChange={(v) => !loading && setOpen(v)}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Item RAB
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Item RAB</DialogTitle>
          <DialogDescription>
            Tambahkan komponen biaya baru ke RAB proyek.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kategori Pekerjaan *</Label>
              <Select
                value={form.category || DEFAULT_CATEGORIES[0]}
                onValueChange={(value) => setForm((f) => ({ ...f, category: value }))}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori pekerjaan" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rab-name">Nama Item *</Label>
              <Input
                id="rab-name"
                placeholder="Contoh: Pekerjaan pondasi"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rab-qty">Qty *</Label>
              <Input
                id="rab-qty"
                type="number"
                min="0.01"
                step="0.01"
                value={form.quantity}
                onChange={(e) => updateCalculations('quantity', e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rab-unit">Unit</Label>
              <Input
                id="rab-unit"
                placeholder="m², unit"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rab-frequency">Frekuensi</Label>
              <Input
                id="rab-frequency"
                placeholder="per hari"
                value={form.frequency}
                onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border p-4 rounded-md bg-muted/20">
             <div className="space-y-2">
              <Label htmlFor="rab-unitPrice">Harga Satuan (RAB)</Label>
              <Input
                id="rab-unitPrice"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.unitPrice}
                onChange={(e) => updateCalculations('unitPrice', e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rab-budget">Total Budget (RAB) *</Label>
              <Input
                id="rab-budget"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.budget}
                onChange={(e) => updateCalculations('budget', e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border p-4 rounded-md bg-muted/20">
             <div className="space-y-2">
              <Label htmlFor="rab-realUnitPrice">Harga Satuan (Realistis)</Label>
              <Input
                id="rab-realUnitPrice"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.realUnitPrice}
                onChange={(e) => updateCalculations('realUnitPrice', e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rab-real">Total Realistis</Label>
              <Input
                id="rab-real"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.realAmount}
                onChange={(e) => updateCalculations('realAmount', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rab-description">Spesifikasi / Keterangan</Label>
            <Textarea
              id="rab-description"
              rows={2}
              placeholder="Spesifikasi teknis..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              disabled={loading}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Item"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
