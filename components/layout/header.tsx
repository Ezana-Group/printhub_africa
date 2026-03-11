"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, Search, ShoppingCart, User } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "All Services", href: "/services" },
      { label: "Large Format Printing", href: "/services/large-format-printing" },
      { label: "3D Printing", href: "/services/3d-printing" },
      { label: "Corporate Orders", href: "/get-a-quote" },
    ],
  },
  {
    label: "Shop",
    href: "/shop",
    children: [
      { label: "All Products", href: "/shop" },
      { label: "New Arrivals", href: "/shop?sort=newest" },
      { label: "Best Sellers", href: "/shop?sort=bestselling" },
    ],
  },
  { label: "Get a Quote", href: "/get-a-quote" },
];

function isActive(href: string, pathname: string, hasChildren?: boolean) {
  if (href === "/") return pathname === "/";
  return hasChildren ? pathname.startsWith(href) : pathname === href;
}

export function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cartCount = useCartStore((s) => s.itemCount());

  useEffect(() => setMounted(true), []);

  const navDropdownClass =
    "w-56 bg-white text-slate-800 border border-slate-200/80 shadow-xl shadow-slate-200/50 rounded-2xl py-1.5 [&_a]:text-slate-800 [&_a:hover]:bg-slate-50";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] border-0 bg-white shadow-xl">
            <nav className="flex flex-col gap-6 pt-8">
              {NAV_LINKS.map((item) =>
                item.children ? (
                  <div key={item.href}>
                    <Link
                      href={item.href}
                      className={`font-semibold ${isActive(item.href, pathname, true) ? "text-primary" : "text-slate-900"}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                    <ul className="mt-2 pl-4 space-y-2">
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link
                            href={c.href}
                            className="text-slate-600 hover:text-slate-900"
                            onClick={() => setMobileOpen(false)}
                          >
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`font-semibold ${isActive(item.href, pathname) ? "text-primary" : "text-slate-900"}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              )}
              <div className="border-t border-slate-200 pt-6 flex flex-col gap-2">
                <Button variant="outline" asChild className="w-full rounded-xl">
                  <Link href="/shop">Shop Now</Link>
                </Button>
                {status === "authenticated" ? (
                  <>
                    <Button asChild className="w-full rounded-xl">
                      <Link href="/account">My Account</Link>
                    </Button>
                    {((session?.user as { role?: string })?.role === "ADMIN" ||
                      (session?.user as { role?: string })?.role === "SUPER_ADMIN" ||
                      (session?.user as { role?: string })?.role === "STAFF") && (
                      <Button variant="secondary" asChild className="w-full rounded-xl">
                        <Link href="/admin/dashboard">Admin</Link>
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button asChild className="w-full rounded-xl" variant="ghost">
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild className="w-full rounded-xl bg-primary hover:bg-primary/90">
                      <Link href="/register">Register</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        <Link
          href="/"
          className="font-display text-xl font-bold text-slate-900 flex items-center gap-2.5"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25">
            P
          </span>
          PrintHub
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((item) =>
            item.children ? (
              <DropdownMenu key={item.href}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`gap-1 rounded-xl ${
                      isActive(item.href, pathname, true)
                        ? "text-primary bg-primary/10 font-semibold"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    {item.label} ▾
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className={navDropdownClass}>
                  {item.children.map((c) => (
                    <DropdownMenuItem key={c.href} asChild>
                      <Link href={c.href} className="focus:bg-slate-50 focus:text-slate-900 rounded-lg mx-1">
                        {c.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
                ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium px-3 py-2 rounded-xl transition-colors ${
                  isActive(item.href, pathname)
                    ? "text-primary bg-primary/10 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Search" asChild className="rounded-xl text-slate-600">
            <Link href="/shop?q=">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label={mounted && cartCount > 0 ? `Cart (${cartCount} items)` : "Cart"} asChild className="rounded-xl text-slate-600 relative">
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {mounted && cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {cartCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Link>
          </Button>
          {status === "authenticated" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account" className="rounded-xl text-slate-600">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={navDropdownClass}>
                <DropdownMenuItem asChild>
                  <Link href="/account" className="focus:bg-slate-50 focus:text-slate-900 rounded-lg mx-1">
                    My Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/orders" className="focus:bg-slate-50 focus:text-slate-900 rounded-lg mx-1">
                    Orders
                  </Link>
                </DropdownMenuItem>
                {((session?.user as { role?: string })?.role === "ADMIN" ||
                  (session?.user as { role?: string })?.role === "SUPER_ADMIN" ||
                  (session?.user as { role?: string })?.role === "STAFF") && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard" className="focus:bg-slate-50 focus:text-slate-900 rounded-lg mx-1">
                      Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/api/auth/signout" className="focus:bg-slate-50 focus:text-slate-900 rounded-lg mx-1">
                    Sign out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex gap-2">
              <Button variant="ghost" size="sm" asChild className="text-slate-600 rounded-xl">
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
