
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  CreditCard,
  UserCog,
  FileText,
  Zap,
  FlaskConical,
  AlertOctagon,
  BarChart3,
  Wallet,
  Users
} from 'lucide-react';

interface NavItem {
  href?: string;
  action?: () => void;
  label: string;
  icon: React.ElementType;
  roles: ('admin' | 'staff')[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
  { href: '/products', label: 'Products', icon: Package, roles: ['admin', 'staff'] },
  { href: '/testers', label: 'Samples / Demos', icon: FlaskConical, roles: ['admin'] },
  { href: '/sales', label: 'Sales', icon: ShoppingCart, roles: ['admin', 'staff'] },
  { href: '/damaged-products', label: 'Damaged & Returned', icon: AlertOctagon, roles: ['admin'] },
  { href: '/customers', label: 'Customers', icon: Users, roles: ['admin'] },
  { href: '/expenses', label: 'Expenses', icon: CreditCard, roles: ['admin'] },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
  { href: '/accounts', label: 'Finance', icon: Wallet, roles: ['admin'] },
  { href: '/user-management', label: 'User Management', icon: UserCog, roles: ['admin'] },
  { href: '/logs', label: 'Activity Log', icon: FileText, roles: ['admin'] },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (!user) return null;

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground sm:flex">
      <div className="flex h-16 items-center border-b px-6 bg-sidebar-accent text-sidebar-accent-foreground">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold font-headline text-lg">
          <Zap className="h-7 w-7 text-primary" />
          <span>SH IMS</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="grid items-start gap-1 px-4 py-4 text-sm font-medium">
          {filteredNavItems.map((item) => (
            item.href ? (
              <Link key={item.label} href={item.href} legacyBehavior passHref>
                <a
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard' && item.href.length > '/dashboard'.length)
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                      : 'text-sidebar-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </a>
              </Link>
            ) : null
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
