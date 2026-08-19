"use client";

export type TabKey = "dashboard" | "focus" | "savings" | "exam";

const TABS: { key: TabKey; label: string; kana: string }[] = [
  { key: "dashboard", label: "表紙", kana: "ダッシュボード" },
  { key: "focus", label: "集中ラボ", kana: "フォーカス" },
  { key: "savings", label: "勉強銀行", kana: "バンク" },
  { key: "exam", label: "受験スタディ", kana: "スタディ" },
];

export function TabNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <nav
      className="flex gap-1 overflow-x-auto no-scrollbar px-1"
      aria-label="セクション切り替え"
    >
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`group relative flex-shrink-0 px-4 pt-3 pb-2.5 rounded-t-card text-left transition-colors ${
              isActive
                ? "bg-paper text-ink"
                : "bg-transparent text-inkSoft hover:text-ink"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="block text-[10px] tracking-[0.18em] font-mono uppercase opacity-60">
              {t.kana}
            </span>
            <span className="block font-display text-base font-bold">
              {t.label}
            </span>
            {isActive && (
              <span className="absolute left-3 right-3 -bottom-[1px] h-[3px] bg-stamp rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
