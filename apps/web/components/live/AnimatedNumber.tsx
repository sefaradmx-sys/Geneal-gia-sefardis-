"use client";

import { useEffect, useState } from "react";

export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  signed = false,
  className,
}: {
  value: number | null;
  decimals?: number;
  suffix?: string;
  signed?: boolean;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === null) {
      return;
    }
    let frame = 0;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  if (value === null) {
    return <span className={className}>—</span>;
  }
  const text = display.toLocaleString("es-MX", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const rounded = Number(display.toFixed(decimals));
  const sign = signed && rounded > 0 ? "+" : "";
  return (
    <span className={className}>
      {sign}
      {text}
      {suffix}
    </span>
  );
}
