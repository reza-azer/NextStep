'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Moon, Sun, BellRing } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarRail,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenuBadge
} from '@/components/ui/sidebar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { useEmployeeData } from '@/hooks/use-employee-data';
import { calculateKGB } from '@/lib/utils';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { employees } = useEmployeeData();

  const employeesToReviewCount = React.useMemo(() => {
    return employees.filter(e => {
      const { daysUntilNextKGB } = calculateKGB(e.lastKGBDate);
      return daysUntilNextKGB <= 90 && daysUntilNextKGB >=0;
    }).length;
  }, [employees]);


  const getTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'KGB Manager';
      case '/reviews':
        return 'Tinjauan KGB';
      default:
        return 'NextStep';
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarRail />
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <h1 className="font-headline text-xl font-semibold text-primary truncate">
              NextStep
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/dashboard'}
                tooltip={{ children: 'KGB Manager' }}
              >
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span>KGB Manager</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/reviews'}
                tooltip={{ children: 'Tinjauan' }}
              >
                <Link href="/reviews">
                  <BellRing />
                  <span>Tinjauan</span>
                </Link>
              </SidebarMenuButton>
              {employeesToReviewCount > 0 && <SidebarMenuBadge>{employeesToReviewCount}</SidebarMenuBadge>}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <SidebarMenuButton
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-destructive"
                    tooltip={{ children: 'Keluar' }}
                    >
                    <LogOut />
                    <span>Keluar</span>
                </SidebarMenuButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Apakah Anda yakin ingin keluar?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Pekerjaan Anda saat ini disimpan di penyimpanan lokal peramban. Untuk lebih aman, pertimbangkan untuk mengekspor data Anda ke file JSON sebelum keluar.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => router.push('/')}
                        className="bg-destructive hover:bg-destructive/90">
                        Keluar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6 sticky top-0 z-30">
            <SidebarTrigger className="hidden md:flex" />
             <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <div className="flex-1">
              <h1 className="font-headline text-lg font-semibold md:text-xl">
                {getTitle()}
              </h1>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
