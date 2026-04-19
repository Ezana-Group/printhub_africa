"use client";

import { useEffect } from "react";
import { trackViewContent } from "@/lib/marketing/event-tracker";

interface Props {
  product: {
    id: string;
    name: string;
    price: number;
    category?: string;
  };
}

export function ViewContentTracker({ product }: Props) {
  useEffect(() => {
    trackViewContent({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
    });
  }, [product]);

  return null;
}
