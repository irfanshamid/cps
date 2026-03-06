
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

type TerminAddDialogProps = {
  projectId: string
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function TerminAddDialog({ projectId }: TerminAddDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    amount: "",
    percentage: "",
    dueDate: "",
    status: "PENDING",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/owner/projects/${projectId}/termin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount) || 0,
          percentage: form.percentage ? parseFloat(form.percentage) : null,
          dueDate: form.dueDate || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Gagal membuat termin")
      }

      toast.success("Termin berhasil dibuat!")
      setForm({
        name: "",
        description: "",
        amount: "",
        percentage: "",
        dueDate: "",
        status: "PENDING",
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
    <Dialog open={open} onOpenChange={(v) => !loading && setOpen(v)}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Termin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Termin</DialogTitle>
          <DialogDescription>
            Buat termin pembayaran baru untuk proyek ini.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="termin-name">Nama Termin *</Label>
            <Input
              id="termin-name"
              placeholder="Contoh: Termin 1, DP 30%"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="termin-description">Deskripsi</Label>
            <Textarea
              id="termin-description"
              rows={3}
              placeholder="Keterangan tambahan..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="termin-amount">Amount (Rp) *</Label>
              <Input
                id="termin-amount"
                type="number"
                min="0"
                step="1000"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="termin-percentage">Percentage (%)</Label>
              <Input
                id="termin-percentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Opsional"
                value={form.percentage}
                onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))}
                disabled={loading}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="termin-duedate">Jatuh Tempo</Label>
              <Input
                id="termin-duedate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                disabled={loading}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="termin-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(val) => setForm((f) => ({ ...f, status: val }))}
                disabled={loading}
              >
                <SelectTrigger id="termin-status">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Termin"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
