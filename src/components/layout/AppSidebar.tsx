
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  CreditCard,
  UserCog, // Added
  Banknote, // Added
  FileText,
  Settings,
  AlertTriangle,
  Zap,
  FlaskConical,
  AlertOctagon,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';
import LiveChatDialog from '@/components/chat/LiveChatDialog';

interface NavItem {
  href?: string;
  action?: () => void;
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
  { href: '/testers', label: 'Testers', icon: FlaskConical, roles: ['admin'] },
  { href: '/damaged-products', label: 'Damaged Products', icon: AlertOctagon, roles: ['admin'] },
  { href: '/user-management', label: 'User Management', icon: UserCog, roles: ['admin'] }, // New
  { href: '/accounts', label: 'Accounts Payable', icon: Banknote, roles: ['admin'] }, // Icon changed, label clarified
  { href: '/logs', label: 'Activity Logs', icon: FileText, roles: ['admin'] },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
  // { href: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (!user) return null;

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));
  const chatNavItem: NavItem = {
    label: 'Chat',
    icon: MessageSquare,
    roles: ['admin', 'staff'],
    action: () => setIsChatOpen(true),
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground sm:flex">
        <div className="flex h-16 items-center border-b px-6 bg-sidebar-accent text-sidebar-accent-foreground">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold font-headline text-lg">
            <Zap className="h-7 w-7 text-primary" />
            <span>VapeTrack</span>
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
            {chatNavItem.roles.includes(user.role) && (
              <Button
                variant="ghost"
                onClick={chatNavItem.action}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all justify-start w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <chatNavItem.icon className="h-5 w-5" />
                {chatNavItem.label}
              </Button>
            )}
          </nav>
        </ScrollArea>
      </aside>
      {user && <LiveChatDialog isOpen={isChatOpen} onOpenChange={setIsChatOpen} />}
    </>
  );
}
