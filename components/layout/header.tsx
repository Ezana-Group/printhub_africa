"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, Search, ShoppingCart, User } from "lucide-react";
import type { BusinessPublic } from "@/lib/business-public";
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
      { label: "Print-on-Demand Catalogue", href: "/catalogue" },
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

export function Header({
  business,
  largeFormatEnabled = false,
}: {
  business?: BusinessPublic;
  largeFormatEnabled?: boolean;
}) {
  const pathname = usePathname();
  const siteName = business?.businessName ?? "PrintHub";
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [navLinks, setNavLinks] = useState(() =>
    largeFormatEnabled
      ? NAV_LINKS
      : NAV_LINKS.map((link) =>
          link.label === "Services" && link.children
            ? {
                ...link,
                children: link.children.filter(
                  (child) => child.href !== "/services/large-format-printing"
                ),
              }
            : link
        )
  );
  const cartCount = useCartStore((s) => s.itemCount());

  useEffect(() => {
    setMounted(true);
    fetch("/api/products/categories")
      .then(res => res.json())
      .then(tree => {
        if (Array.isArray(tree)) {
          // Filter tree to only show levels that contain items marked for nav
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const buildNavItems = (nodes: any[], depth = 0): {label: string, href: string}[] => {
            const items: {label: string, href: string}[] = [];
            nodes.forEach(node => {
              // Should we show it? Yes if it's marked showInNav OR if it has children that are marked
              // For simplicity, we show it if it's in the top 2 levels or explicitly marked
              const showThis = node.showInNav || depth < 1;
              if (showThis) {
                const indent = depth > 0 ? "\u00A0\u00A0".repeat(depth) + "— " : "";
                items.push({ label: `${indent}${node.name}`, href: `/shop?category=${node.slug}` });
                if (node.children?.length && depth < 2) {
                  items.push(...buildNavItems(node.children, depth + 1));
                }
              }
            });
            return items;
          };

          const shopChildren = buildNavItems(tree);
          if (shopChildren.length === 0) {
            shopChildren.push({ label: "All Products", href: "/shop" });
          }
          
          setNavLinks(prev => prev.map(link => 
            link.label === "Shop" 
              ? { ...link, children: [{ label: "All Products", href: "/shop" }, ...shopChildren] }
              : link
          ));
        }
      })
      .catch(() => {
        // Fallback to hardcoded NAV_LINKS already set in state
      });
  }, []);

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
            className="flex w-[280px] max-w-[85vw] flex-col border-0 bg-white p-0 shadow-xl"
          >
            {/* Fixed header — logo (close button is absolute in SheetContent) */}
            <div className="flex flex-shrink-0 items-center border-b border-slate-200 px-6 py-4 pr-14">
              <Image
                src={business?.logo || "/logo.png"}
                alt={siteName}
                width={120}
                height={32}
                className="h-8 w-auto object-contain"
                priority
              />
            </div>

            {/* Fixed Login/Register or user strip — always visible at top */}
            {status === "authenticated" ? (
              <div className="flex flex-shrink-0 items-center gap-3 border-b border-slate-200 bg-slate-50/50 px-6 py-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {(session?.user?.name ?? "?")[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {session?.user?.name ?? "Account"}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-shrink-0 gap-2 border-b border-slate-200 bg-slate-50/50 px-6 py-4">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl border-slate-300" asChild>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    Login
                  </Link>
                </Button>
                <Button size="sm" className="flex-1 rounded-xl bg-primary hover:bg-primary/90" asChild>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    Register
                  </Link>
                </Button>
              </div>
            )}

            {/* Scrollable nav links */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <nav className="flex flex-col gap-1 p-6">
                {navLinks.map((item) =>
                  item.children ? (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        className={`block rounded-lg px-4 py-3 text-sm font-semibold transition hover:bg-slate-50 ${
                          isActive(item.href, pathname, true) ? "text-primary" : "text-slate-900"
                        }`}
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.label}
                      </Link>
                      <ul className="space-y-0.5 pl-4">
                        {item.children.map((c) => (
                          <li key={c.href}>
                            <Link
                              href={c.href}
                              className="block rounded-lg px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
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
                      className={`block rounded-lg px-4 py-3 text-sm font-semibold transition hover:bg-slate-50 ${
                        isActive(item.href, pathname) ? "text-primary" : "text-slate-900"
                      }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )
                )}
                <div className="pt-4">
                  <Link
                    href="/get-a-quote"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full rounded-xl border-2 border-primary py-3 text-center text-sm font-semibold text-primary transition hover:bg-orange-50"
                  >
                    Get a Quote
                  </Link>
                </div>
                {status === "authenticated" && (
                  <>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      My Account
                    </p>
                    <Link
                      href="/account"
                      className="block rounded-lg px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => setMobileOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/account/orders"
                      className="block rounded-lg px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => setMobileOpen(false)}
                    >
                      My Orders
                    </Link>
                    <Link
                      href="/account/quotes"
                      className="block rounded-lg px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => setMobileOpen(false)}
                    >
                      My Quotes
                    </Link>
                    <Link
                      href="/account/settings"
                      className="block rounded-lg px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => setMobileOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        signOut();
                      }}
                      className="w-full rounded-lg px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Sign out
                    </button>
                  </>
                )}
                <div className="h-6" />
              </nav>
            </div>

            {/* Fixed footer — Shop Now */}
            <div className="flex flex-shrink-0 border-t border-slate-200 bg-white px-6 py-4">
              <Button className="w-full rounded-xl font-semibold" asChild>
                <Link href="/shop" onClick={() => setMobileOpen(false)}>
                  Shop Now
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <Link
          href="/"
          className="font-display text-xl font-bold text-slate-900 flex items-center gap-2.5"
        >
          <Image
            src={business?.logo || "/logo.png"}
            alt={siteName}
            width={140}
            height={36}
            className="h-9 w-auto object-contain object-left"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) =>
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
                <DropdownMenuItem
                  className="focus:bg-red-50 focus:text-red-900 rounded-lg mx-1 text-red-600 cursor-pointer"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sign out
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
