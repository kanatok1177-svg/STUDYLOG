"use client";

import { useEffect, useState } from "react";

/**
 * 数値専用input。
 * 入力中の表示は文字列で自前管理し、number stateへ直結させない。
 * (直結させると、空欄にした瞬間に0が強制的に入り、消したはずの「0」が
 *  居座って見える/次の入力の先頭に紛れ込む、という不具合が起きるため)
 * 範囲外や空欄のまま離れた(blur)時だけ、min/maxに丸めて確定させる。
 */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  className,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState(String(value));

  // 外部要因(プリセット選択・リセットなど)でvalueが変わった時だけ表示を同期する。
  // 自分のタイピングによる変化では上書きしない。
  useEffect(() => {
    setText((prev) => (prev !== "" && Number(prev) === value ? prev : String(value)));
  }, [value]);

  function clamp(n: number): number {
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      disabled={disabled}
      className={className}
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw === "" || raw === "-") return; // 空欄は入力途中として許容(確定はblurで)
        const n = Number(raw);
        if (!Number.isNaN(n)) onChange(clamp(n));
      }}
      onBlur={() => {
        const n = Number(text);
        const fallback = min ?? 0;
        const next = text === "" || Number.isNaN(n) ? fallback : clamp(n);
        setText(String(next));
        onChange(next);
      }}
    />
  );
}
