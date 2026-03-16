'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Header } from '@/components/layout/header';
import {
  LayoutDashboard,
  Wallet,
  Briefcase,
  Users,
  Settings,
  ListTodo,
  HardHat,
  BookOpen,
} from 'lucide-react';

type OwnerLayoutProps = {
  children: ReactNode;
};

const ownerMenu = [
  {
    label: 'Dashboard',
    href: '/owner/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Cashflow',
    href: '/owner/cashflow',
    icon: Wallet,
  },
  {
    label: 'Proyek',
    href: '/owner/projects',
    icon: Briefcase,
  },
  {
    label: 'Progress',
    href: '/owner/progress',
    icon: ListTodo,
  },
  {
    label: 'Tim Lapangan',
    href: '/owner/teams',
    icon: HardHat,
  },
  {
    label: 'Staff',
    href: '/owner/staff',
    icon: Users,
  },
  {
    label: 'SOP & Template',
    href: '/owner/sop',
    icon: BookOpen,
  },
  {
    label: 'Pengaturan',
    href: '/owner/profile',
    icon: Settings,
  },
];

import Image from 'next/image';

export default function OwnerLayout({ children }: OwnerLayoutProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center pt-4 pb-2">
            <Image src="/brand.png" alt="Logo" width={200} height={60} />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu Owner</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ownerMenu.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <Header />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
