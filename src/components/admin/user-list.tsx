
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Search, Trash2, ChevronLeft, ChevronRight, Loader2, MoreVertical, Edit, KeyRound, Ban, CheckCircle, Plus } from "lucide-react"
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
import { toast } from "sonner"
import { format } from "date-fns"
import { UserFormDialog, ResetPasswordDialog, CredentialsDialog } from "./user-dialogs"

type User = {
  id: string
  username: string
  role: string
  isActive: boolean
  createdAt: string
  owner?: { companyName: string | null } | null
}

export function UserList() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Dialog States
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [credentialData, setCredentialData] = useState<{ username: string; password?: string } | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        role: roleFilter,
      })
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      if (data.success) {
        setUsers(data.users)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      toast.error("Gagal memuat data user")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 500)
    return () => clearTimeout(timer)
  }, [search, roleFilter, page])

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      const res = await fetch(`/api/admin/users/${deletingId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Gagal menghapus user")
      
      toast.success("User berhasil dihapus")
      fetchUsers()
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus")
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleStatus = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      
      if (!res.ok) throw new Error("Gagal mengubah status user")
      
      toast.success(`User berhasil ${user.isActive ? "dinonaktifkan" : "diaktifkan"}`)
      fetchUsers()
    } catch (error) {
      toast.error("Terjadi kesalahan")
    }
  }

  const handleAddSuccess = (data: any) => {
    fetchUsers()
    if (data.plainPassword) {
      setCredentialData({
        username: data.user.username,
        password: data.plainPassword
      })
    }
  }

  const handleEditSuccess = () => {
    fetchUsers()
  }

  const handleResetSuccess = (data: any) => {
    if (data.password) {
      setCredentialData({
        username: data.username,
        password: data.password
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari username..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Role</SelectItem>
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="STAFF">Staff</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah User
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Perusahaan (Owner)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat data...
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Tidak ada user ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>{user.owner?.companyName || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "destructive"}>
                      {user.isActive ? "Aktif" : "Banned"}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(user.createdAt), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setResetUser(user)}>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Ganti Password
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                          {user.isActive ? (
                            <>
                              <Ban className="mr-2 h-4 w-4 text-destructive" />
                              <span className="text-destructive">Ban User</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              <span className="text-green-600">Unban User</span>
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeletingId(user.id)}
                          disabled={user.role === 'ADMIN'}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Halaman {page} dari {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus User?</AlertDialogTitle>
            <AlertDialogDescription>
              User ini akan dihapus permanen beserta data terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogs */}
      <UserFormDialog 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen} 
        onSuccess={handleAddSuccess}
      />
      
      <UserFormDialog 
        open={!!editingUser} 
        onOpenChange={(open) => !open && setEditingUser(null)} 
        user={editingUser}
        onSuccess={handleEditSuccess}
      />

      <ResetPasswordDialog 
        open={!!resetUser} 
        onOpenChange={(open) => !open && setResetUser(null)} 
        user={resetUser}
        onSuccess={handleResetSuccess}
      />

      <CredentialsDialog 
        open={!!credentialData} 
        onOpenChange={(open) => !open && setCredentialData(null)} 
        data={credentialData}
      />
    </div>
  )
}
