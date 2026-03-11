"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 500, suffix: "+", label: "Jobs Completed" },
  { value: 47, suffix: "", label: "Counties Delivered To" },
];

export function AboutHero() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex flex-wrap gap-10 md:gap-16 mt-12">
      {STATS.map(({ value, suffix, label }) => (
        <div key={label} className="flex flex-col">
          <span
            className={`font-display font-extrabold text-3xl md:text-4xl text-white transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {value}
            {suffix}
          </span>
          <span className="font-body text-sm text-white/60 mt-1">{label}</span>
        </div>
      ))}
    </div>
  );
}
