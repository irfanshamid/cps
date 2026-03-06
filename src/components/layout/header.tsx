'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserRole } from '@prisma/client';
import { LogOut, User, Settings, Bell, Search, RefreshCw } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

import Image from 'next/image';

// ... (existing imports)

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) return null;

  const initials = getInitials(session.user.username);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md px-6 py-4">
      <div className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <SidebarTrigger className="md:hidden" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 hidden md:block" />
            <span className="text-sm hidden md:block" suppressHydrationWarning>Data terupdate {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join(' ')} {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
            <Image 
              src="/favicon.png" 
              alt="Logo" 
              width={32} 
              height={32} 
              className="md:hidden w-8 h-8 object-contain" 
            />
          </div>
        </div>

        {/* ... (rest of the component) */}

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-full bg-white pl-1 pr-4 py-1 shadow-sm border border-transparent hover:border-border transition-colors outline-none focus:ring-2 focus:ring-primary/20">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground hidden sm:block">
                  {session.user.username}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{session.user.username}</p>
                <p className="text-xs text-muted-foreground">
                  {session.user.role}
                </p>
              </div>
              <DropdownMenuItem 
                onClick={() => {
                  if (session.user.role === 'OWNER') router.push('/owner/profile');
                  else if (session.user.role === 'STAFF') router.push('/staff/profile');
                }} 
                className="rounded-lg cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
