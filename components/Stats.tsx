"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, motion } from "framer-motion";
import { stats } from "@/lib/data";
import { Reveal } from "./ui/Reveal";

function Counter({
  value,
  suffix,
  decimals = 0,
}: {
  value: number;
  suffix: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const duration = 1800;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {display.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

export function Stats() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-gold-500/15 bg-gradient-to-b from-white/[0.04] to-transparent p-8 sm:p-14">
            <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden />
            <div
              className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full blur-3xl"
              style={{ background: "radial-gradient(closest-side, rgba(212,175,55,0.18), transparent)" }}
              aria-hidden
            />
            <div className="relative grid grid-cols-2 gap-8 lg:grid-cols-4">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="font-display text-4xl font-bold text-gradient-gold sm:text-5xl">
                    <Counter value={s.value} suffix={s.suffix} decimals={s.decimals} />
                  </div>
                  <div className="mt-2 text-sm text-mist-300">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
