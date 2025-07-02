
"use client";

import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings2, ChevronsLeftRight } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from 'next/link';
import { Zap, LayoutDashboard, ShoppingCart, Package, CreditCard, AlertTriangle, FileText, FlaskConical, AlertOctagon, BarChart3, UserCog, Wallet, Users } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: ('admin' | 'staff')[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
  { href: '/sales', label: 'Sales', icon: ShoppingCart, roles: ['admin', 'staff'] },
  { href: '/products', label: 'Products', icon: Package, roles: ['admin', 'staff'] },
  { href: '/expenses', label: 'Expenses', icon: CreditCard, roles: ['admin'] },
  { href: '/due-sales', label: 'Due Sales', icon: AlertTriangle, roles: ['admin'] },
  { href: '/testers', label: 'Samples / Demos', icon: FlaskConical, roles: ['admin'] },
  { href: '/damaged-products', label: 'Damaged Products', icon: AlertOctagon, roles: ['admin'] },
  { href: '/user-management', label: 'User Management', icon: UserCog, roles: ['admin'] },
  { href: '/customers', label: 'Customers', icon: Users, roles: ['admin'] },
  { href: '/accounts', label: 'Accounts', icon: Wallet, roles: ['admin'] },
  { href: '/logs', label: 'Activity Logs', icon: FileText, roles: ['admin'] },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
];


export default function AppHeader() {
  const { user, actions } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    actions.logout(router.push);
  };

  if (!user) return null;
  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));


  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
       <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <ChevronsLeftRight className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs bg-sidebar text-sidebar-foreground">
          <nav className="grid gap-6 text-lg font-medium">
          <Link href="/dashboard" className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base">
            <Zap className="h-5 w-5 transition-all group-hover:scale-110" />
            <span className="sr-only">SH IMS</span>
          </Link>
            {filteredNavItems.map((item) => (
            <Link key={item.href} href={item.href} legacyBehavior passHref>
              <a
                className={cn(
                  'flex items-center gap-4 px-2.5 transition-colors hover:text-sidebar-accent-foreground',
                   pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard' && item.href.length > '/dashboard'.length)
                    ? 'text-sidebar-accent-foreground font-semibold'
                    : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </a>
            </Link>
          ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Can add a search bar here if needed */}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
            <Avatar>
              <AvatarImage src={`https://placehold.co/40x40.png?text=${getInitials(user.name)}`} alt={user.name} data-ai-hint="user avatar"/>
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user.role === 'admin' && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/admin/account-settings">
                <Settings2 className="mr-2 h-4 w-4" />
                Manage Account
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
