'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FolderKanban, LayoutDashboard, LogOut } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const getTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard';
      default:
        return 'NextStep';
    }
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarRail />
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <Link href="/dashboard">
                <FolderKanban className="text-primary" />
                <span className="sr-only">NextStep</span>
              </Link>
            </Button>
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
                tooltip={{ children: 'Dashboard' }}
              >
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <SidebarMenuButton
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-destructive"
                    tooltip={{ children: 'Exit' }}
                    >
                    <LogOut />
                    <span>Exit</span>
                </SidebarMenuButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to exit?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Your current work is saved in your browser's local storage. To be extra safe, consider exporting your data to a JSON file before you leave.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => router.push('/')}
                        className="bg-destructive hover:bg-destructive/90">
                        Exit
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6 sticky top-0 z-30">
            <div className="flex-1">
              <h1 className="font-headline text-lg font-semibold md:text-xl">
                {getTitle()}
              </h1>
            </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
