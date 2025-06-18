
"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Home as HomeIcon, LogOut, UserCircle2, PlusCircle, List, MessageSquare, UserCog, Menu, HelpCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const RentEaseLogo = () => (
  <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
    <HomeIcon className="h-8 w-8" />
    <span className="text-xl sm:text-2xl font-headline font-bold">RentEasy</span>
  </Link>
);

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  isSheet?: boolean; 
}

const NavItemLink = ({ href, label, icon: Icon, isActive, isSheet = false }: NavItemProps) => {
  const commonClasses = cn(
    "flex items-center px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent/10 hover:text-primary",
    isActive
      ? "text-primary font-semibold bg-accent/10"
      : "text-foreground",
    isSheet && "w-full justify-start text-base py-3" // Specific styles for sheet items
  );

  if (isSheet) {
    return (
      <SheetClose asChild>
        <Link href={href} className={commonClasses}>
          <Icon className="h-5 w-5 mr-3" />
          {label}
        </Link>
      </SheetClose>
    );
  }

  return (
    <Link href={href} className={commonClasses}>
      <Icon className="h-5 w-5 mr-2" />
      {label}
    </Link>
  );
};


export function Navbar() {
  const { user, logout, isOwner, isTenant } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: HomeIcon, roles: ["owner", "tenant"] },
    { href: "/properties", label: "Browse Properties", icon: List, roles: ["tenant"] },
    { href: "/properties/my-listings", label: "My Listings", icon: List, roles: ["owner"] },
    { href: "/properties/add", label: "Add Property", icon: PlusCircle, roles: ["owner"] },
    { href: "/chat", label: "Messages", icon: MessageSquare, roles: ["owner", "tenant"] },
    { href: "/profile", label: "Profile", icon: UserCog, roles: ["owner", "tenant"] },
    { href: "/help", label: "Help", icon: HelpCircle, roles: ["owner", "tenant"] },
  ];

  if (!user) return null; // Or some loading state if user is not yet available

  const activeUserNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <nav className="sticky top-0 z-50 bg-card shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[5rem] py-2">
          <RentEaseLogo />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center flex-wrap justify-end gap-x-1 sm:gap-x-2 md:gap-x-4 gap-y-1">
            {activeUserNavItems.map((item) => (
              <NavItemLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
              />
            ))}
            <div className="flex items-center text-sm text-foreground ml-1 sm:ml-2">
              <UserCircle2 className="h-5 w-5 mr-2 text-muted-foreground" />
              <span>{user.name} ({user.role})</span>
            </div>
            <Button variant="destructive" size="sm" onClick={logout}>
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>

          {/* Mobile Navigation Trigger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[340px] flex flex-col p-0">
                <SheetHeader className="p-6 pb-2">
                   <SheetTitle className="text-left">
                    <RentEaseLogo />
                  </SheetTitle>
                </SheetHeader>
                <Separator />
                <div className="flex-grow p-4 space-y-2">
                  {activeUserNavItems.map((item) => (
                     <NavItemLink
                        key={`sheet-${item.href}`}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                        isSheet={true}
                      />
                  ))}
                </div>
                <Separator />
                <div className="p-4 space-y-3">
                  <div className="flex items-center text-sm text-foreground">
                    <UserCircle2 className="h-5 w-5 mr-2 text-muted-foreground" />
                    <div>
                      <div>{user.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                    </div>
                  </div>
                   <SheetClose asChild>
                    <Button variant="destructive" size="sm" onClick={logout} className="w-full">
                      <LogOut className="h-5 w-5 mr-2" />
                      Logout
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
