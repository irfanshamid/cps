import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { StaffList } from '@/components/owner/staff-list';

export default async function OwnerStaffPage() {
  const session = await getSession();

  if (
    !session ||
    !session.user ||
    session.user.role !== 'OWNER' ||
    !session.user.ownerId
  ) {
    redirect('/login');
  }

  const staff = await prisma.user.findMany({
    where: {
      ownerId: session.user.ownerId,
      role: 'STAFF',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      isActive: true,
      createdAt: true,
      position: true,
    },
  });

  // Transform dates to strings for client component
  const formattedStaff = staff.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }))

  return (
    <div className="min-h-screen bg-background w-full">
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Kelola akun staff dan posisi anggota tim
          </p>
        </div>

        <StaffList initialStaff={formattedStaff} />
      </main>
    </div>
  );
}
