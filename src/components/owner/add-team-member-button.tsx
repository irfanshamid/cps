
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddTeamMemberDialog } from "@/components/owner/add-team-member-dialog"

type StaffOption = {
  id: string
  username: string
  position?: string | null
}

type AddTeamMemberButtonProps = {
  projectId: string
  staff: StaffOption[]
  existingMemberIds: string[]
}

export function AddTeamMemberButton({ projectId, staff, existingMemberIds }: AddTeamMemberButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Tambah Anggota
      </Button>
      <AddTeamMemberDialog
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
        staff={staff}
        existingMemberIds={existingMemberIds}
      />
    </>
  )
}
