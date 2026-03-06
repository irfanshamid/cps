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
import { LayoutDashboard, ListTodo, Settings } from 'lucide-react';

type StaffLayoutProps = {
  children: ReactNode;
};

const staffMenu = [
  {
    label: 'Dashboard',
    href: '/staff/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Tugas Saya',
    href: '/staff/tasks',
    icon: ListTodo,
  },
  {
    label: 'Pengaturan',
    href: '/staff/profile',
    icon: Settings,
  },
];

import Image from 'next/image';

// ...

export default function StaffLayout({ children }: StaffLayoutProps) {
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
            <SidebarGroupLabel>Menu Staff</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {staffMenu.map((item) => {
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
