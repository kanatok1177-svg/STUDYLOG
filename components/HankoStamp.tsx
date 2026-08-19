"use client";

import { useEffect, useState } from "react";

export function HankoStamp({
  char,
  size = 56,
  animate = false,
  tone = "stamp",
}: {
  char: string;
  size?: number;
  animate?: boolean;
  tone?: "stamp" | "gold" | "ink";
}) {
  const [play, setPlay] = useState(animate);
  useEffect(() => {
    if (animate) setPlay(true);
  }, [animate]);

  const color =
    tone === "gold" ? "#B98F2C" : tone === "ink" ? "#223047" : "#A63D33";

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full border-[3px] select-none ${
        play ? "animate-stampDown" : ""
      }`}
      style={{
        width: size,
        height: size,
        borderColor: color,
        color,
        transform: "rotate(-10deg)",
        boxShadow: `inset 0 0 0 2px ${color}22`,
      }}
      aria-hidden="true"
    >
      <span
        className="font-display font-bold leading-none"
        style={{ fontSize: size * 0.42 }}
      >
        {char}
      </span>
    </div>
  );
}
