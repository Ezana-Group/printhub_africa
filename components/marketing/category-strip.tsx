"use client";

import type { LucideIcon } from "lucide-react";
import {
  Car,
  CreditCard,
  Gift,
  Image as ImageIcon,
  Palette,
  Printer,
  Shirt,
  Cuboid,
} from "lucide-react";

type CategoryTile = {
  id: string;
  name: string;
  slug: string;
  targetId: string;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
};

const COLOR_PALETTE: Array<{ bgColor: string; textColor: string }> = [
  { bgColor: "#FFF3E0", textColor: "#E65100" },
  { bgColor: "#E8F5E9", textColor: "#2E7D32" },
  { bgColor: "#E3F2FD", textColor: "#1565C0" },
  { bgColor: "#FCE4EC", textColor: "#880E4F" },
  { bgColor: "#F3E5F5", textColor: "#6A1B9A" },
  { bgColor: "#E0F7FA", textColor: "#00695C" },
  { bgColor: "#FFF8E1", textColor: "#F57F17" },
  { bgColor: "#EDE7F6", textColor: "#4527A0" },
];

function pickTargetId(slug: string, name: string): string {
  const value = `${slug} ${name}`.toLowerCase();
  if (value.includes("3d")) return "shop-3d-prints";
  if (
    value.includes("apparel") ||
    value.includes("shirt") ||
    value.includes("mug") ||
    value.includes("gift") ||
    value.includes("card")
  ) {
    return "print-on-demand";
  }
  return "our-services";
}

function pickIcon(slug: string, name: string): LucideIcon {
  const value = `${slug} ${name}`.toLowerCase();
  if (value.includes("vehicle") || value.includes("wrap")) return Car;
  if (value.includes("3d")) return Cuboid;
  if (value.includes("banner") || value.includes("sign")) return ImageIcon;
  if (value.includes("card")) return CreditCard;
  if (value.includes("design")) return Palette;
  if (value.includes("shirt") || value.includes("apparel")) return Shirt;
  if (value.includes("mug") || value.includes("gift")) return Gift;
  return Printer;
}

export function CategoryStrip({
  categories,
}: {
  categories: Array<{ id: string; name: string; slug: string }>;
}) {
  const tiles: CategoryTile[] = categories.slice(0, 8).map((category, index) => {
    const colors = COLOR_PALETTE[index % COLOR_PALETTE.length];
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      targetId: pickTargetId(category.slug, category.name),
      icon: pickIcon(category.slug, category.name),
      bgColor: colors.bgColor,
      textColor: colors.textColor,
    };
  });

  if (tiles.length === 0) return null;

  return (
    <section className="py-8 bg-white">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="grid grid-flow-col auto-cols-[minmax(150px,1fr)] gap-3 lg:grid-flow-row lg:grid-cols-8">
            {tiles.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  type="button"
                  className="rounded-2xl p-4 text-center transition-all duration-200 ease-in-out hover:scale-[1.03] hover:brightness-95"
                  style={{ backgroundColor: category.bgColor, color: category.textColor }}
                  onClick={() => {
                    const target = document.getElementById(category.targetId);
                    if (target) {
                      target.scrollIntoView({ behavior: "smooth", block: "start" });
                      return;
                    }
                    window.location.href = `/shop?category=${encodeURIComponent(category.slug)}`;
                  }}
                >
                  <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/45">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="block text-sm font-medium">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
