"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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

function MobileNavLink({
  href,
  label,
  onClick,
  sub = false,
}: {
  href: string;
  label: string;
  onClick: () => void;
  sub?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block py-3 px-4 rounded-lg text-sm transition hover:bg-gray-50 ${
        sub ? "text-gray-600 pl-4" : "font-semibold text-gray-900"
      }`}
    >
      {label}
    </Link>
  );
}

const NAV_LINKS = [
  { label: "Home", href: "/" },
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
          <SheetContent
            side="left"
            className="w-[85vw] max-w-sm border-0 bg-white shadow-2xl p-0 flex flex-col overflow-hidden [&>button]:hidden"
          >
            <div className="flex flex-col h-full min-h-0">
              {/* Header — fixed, never scrolls */}
              <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
                <span className="font-display font-bold text-lg text-[#0A0A0A]">PrintHub</span>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <span className="sr-only">Close</span>
                  <span className="text-xl leading-none">×</span>
                </Button>
              </div>

              {/* Login / Register — fixed, always visible */}
              {status !== "authenticated" ? (
                <div className="flex gap-2 px-6 py-4 border-b flex-shrink-0 bg-gray-50">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 py-2 text-center text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 py-2 text-center text-sm font-medium bg-[#FF4D00] text-white rounded-lg hover:bg-[#e64400]"
                  >
                    Register
                  </Link>
                </div>
              ) : session ? (
                <div className="flex items-center gap-3 px-6 py-4 border-b flex-shrink-0 bg-gray-50">
                  <div className="w-9 h-9 rounded-full bg-[#FF4D00] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {session.user?.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{session.user?.name ?? "Account"}</p>
                    <p className="text-xs text-gray-500 truncate">{session.user?.email ?? ""}</p>
                  </div>
                </div>
              ) : null}

              {/* Scrollable nav links */}
              <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
                <nav className="p-6 space-y-1">
                  <MobileNavLink href="/" label="Home" onClick={() => setMobileOpen(false)} />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest pt-4 pb-1">Services</p>
                  <MobileNavLink href="/services" label="All Services" onClick={() => setMobileOpen(false)} sub />
                  <MobileNavLink href="/services/large-format-printing" label="Large Format Printing" onClick={() => setMobileOpen(false)} sub />
                  <MobileNavLink href="/services/3d-printing" label="3D Printing" onClick={() => setMobileOpen(false)} sub />
                  <MobileNavLink href="/get-a-quote" label="Corporate Orders" onClick={() => setMobileOpen(false)} sub />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest pt-4 pb-1">Shop</p>
                  <MobileNavLink href="/shop" label="All Products" onClick={() => setMobileOpen(false)} sub />
                  <MobileNavLink href="/shop?sort=newest" label="New Arrivals" onClick={() => setMobileOpen(false)} sub />
                  <MobileNavLink href="/shop?sort=bestselling" label="Best Sellers" onClick={() => setMobileOpen(false)} sub />
                  <div className="pt-4">
                    <Link
                      href="/get-a-quote"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full py-3 text-center font-semibold text-[#FF4D00] border-2 border-[#FF4D00] rounded-xl hover:bg-orange-50"
                    >
                      Get a Quote
                    </Link>
                  </div>
                  {status === "authenticated" && (
                    <>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest pt-4 pb-1">My Account</p>
                      <MobileNavLink href="/account" label="Dashboard" onClick={() => setMobileOpen(false)} sub />
                      <MobileNavLink href="/account/orders" label="My Orders" onClick={() => setMobileOpen(false)} sub />
                      <MobileNavLink href="/account/quotes" label="My Quotes" onClick={() => setMobileOpen(false)} sub />
                      <MobileNavLink href="/account/uploads" label="My Uploads" onClick={() => setMobileOpen(false)} sub />
                      <MobileNavLink href="/account/settings" label="Settings" onClick={() => setMobileOpen(false)} sub />
                      {((session?.user as { role?: string })?.role === "ADMIN" ||
                        (session?.user as { role?: string })?.role === "SUPER_ADMIN" ||
                        (session?.user as { role?: string })?.role === "STAFF") && (
                        <MobileNavLink href="/admin/dashboard" label="Admin" onClick={() => setMobileOpen(false)} sub />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          signOut();
                          setMobileOpen(false);
                        }}
                        className="w-full text-left py-3 px-4 text-sm text-red-500 hover:bg-red-50 rounded-lg mt-1"
                      >
                        Sign out
                      </button>
                    </>
                  )}
                  <div className="h-6" />
                </nav>
              </div>

              {/* Footer — fixed */}
              <div className="flex-shrink-0 px-6 py-4 border-t bg-white">
                <Link
                  href="/shop"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full py-3 text-center font-semibold bg-[#0A0A0A] text-white rounded-xl"
                >
                  Shop Now
                </Link>
              </div>
            </div>
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
