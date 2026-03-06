
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, Search, Copy } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { StaffActions } from "@/components/owner/staff-actions"
import { GenerateStaffButton } from "@/components/owner/generate-staff-button"
import { toast } from "sonner"

interface Staff {
  id: string
  username: string
  position: string | null
  isActive: boolean
  createdAt: string
}

interface StaffListProps {
  initialStaff: Staff[]
}

export function StaffList({ initialStaff }: StaffListProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [staffList, setStaffList] = useState<Staff[]>(initialStaff)
  const [loading, setLoading] = useState(false)

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/owner/staff`)
      if (!res.ok) throw new Error("Gagal mengambil data staff")
      const data = await res.json()
      setStaffList(data.staff)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCredential = async (username: string) => {
    await navigator.clipboard.writeText(username)
    toast.success("Username berhasil disalin")
  }

  const filteredStaff = staffList.filter((staff) =>
    staff.username.toLowerCase().includes(search.toLowerCase()) ||
    (staff.position && staff.position.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 pb-2">
            <Users className="h-5 w-5" />
            Daftar Staff
          </CardTitle>
          <CardDescription>
            Total: {staffList.length} staff terdaftar
          </CardDescription>
        </div>
        <GenerateStaffButton />
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama atau jabatan..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredStaff.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada staff ditemukan.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStaff.map((s) => {
                return (
                  <div
                    key={s.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-lg">{s.username}</p>
                        {s.position && (
                            <Badge variant="secondary" className="text-xs font-normal">
                                {s.position}
                            </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Dibuat pada: {format(new Date(s.createdAt), "dd MMM yyyy", { locale: idLocale })}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button variant="outline" size="sm" onClick={() => handleCopyCredential(s.username)}>
                        <Copy className="mr-2 h-3 w-3" />
                        Copy Username
                      </Button>
                      <StaffActions
                        staffId={s.id}
                        username={s.username}
                        position={s.position || ""}
                        isActive={s.isActive}
                      />
                    </div>
                  </div>
                )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
