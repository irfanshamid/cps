'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

export default function NewCashflowPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const MAX_MONEY = 999999999999999.99;
  const MAX_QTY = 99999999.99;
  const [formData, setFormData] = useState({
    type: 'IN' as 'IN' | 'OUT',
    amount: '',
    date: '',
    description: '',
    category: '',
    projectId: '',
    quantity: '1',
    unit: '',
  });

  useEffect(() => {
    // Fetch projects
    fetch('/api/owner/projects')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProjects(data.projects || []);
        }
      })
      .catch(() => {
        toast.error('Gagal memuat daftar proyek');
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(formData.amount) || 0;
      const quantity = parseFloat(formData.quantity) || 0;

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Jumlah harus lebih dari 0');
      }
      if (amount > MAX_MONEY) {
        throw new Error('Jumlah terlalu besar (maksimum Rp 999.999.999.999.999,99)');
      }
      if (!Number.isFinite(quantity) || quantity < 0) {
        throw new Error('Qty tidak valid');
      }
      if (quantity > MAX_QTY) {
        throw new Error('Qty terlalu besar (maksimum 99.999.999,99)');
      }

      const response = await fetch('/api/owner/cashflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount,
          quantity,
          unit: formData.unit || undefined,
          projectId: formData.projectId || null,
          date: formData.date || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menambah transaksi');
      }

      toast.success('Transaksi berhasil ditambahkan!');
      router.push('/owner/cashflow');
      router.refresh();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Terjadi kesalahan';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Tambah Transaksi</h1>
          <p className="text-muted-foreground">
            Catat transaksi masuk atau keluar
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Transaksi</CardTitle>
            <CardDescription>Isi detail transaksi Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipe Transaksi *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as 'IN' | 'OUT' })
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">Cash In (Masuk)</SelectItem>
                    <SelectItem value="OUT">Cash Out (Keluar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Qty</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    disabled={loading}
                    placeholder="Unit"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Tanggal (Opsional)</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Jumlah (Rp) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  disabled={loading}
                  placeholder="Contoh: Material, Gaji, dll"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectId">Proyek (Opsional)</Label>
                <Select
                  value={formData.projectId || 'none'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      projectId: value === 'none' ? '' : value,
                    })
                  }
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

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Transaksi'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
