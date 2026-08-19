"use client";

import { useMemo, useState } from "react";
import { AppState } from "@/lib/types";
import { uid, todayISO } from "@/lib/storage";

export function ExamStudy({
  state,
  update,
}: {
  state: AppState;
  update: (fn: (prev: AppState) => AppState) => void;
}) {
  return (
    <div className="space-y-6 animate-fadeUp">
      <MockExamChart state={state} update={update} />
      <SubjectLogs state={state} update={update} />
      <TodoList state={state} update={update} />
    </div>
  );
}

function MockExamChart({
  state,
  update,
}: {
  state: AppState;
  update: (fn: (prev: AppState) => AppState) => void;
}) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayISO());
  const [hensachi, setHensachi] = useState(55);

  const results = [...state.exam.mockResults].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const chart = useMemo(() => {
    if (results.length === 0) return null;
    const values = results.map((r) => r.hensachi);
    const min = Math.min(...values, 30) - 3;
    const max = Math.max(...values, 70) + 3;
    const w = 100;
    const h = 100;
    const stepX = results.length > 1 ? w / (results.length - 1) : 0;
    const points = results.map((r, i) => {
      const x = results.length > 1 ? i * stepX : w / 2;
      const y = h - ((r.hensachi - min) / (max - min)) * h;
      return { x, y, r };
    });
    const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    return { points, path };
  }, [results]);

  function addResult() {
    if (!name.trim()) return;
    update((prev) => ({
      ...prev,
      exam: {
        ...prev.exam,
        mockResults: [
          ...prev.exam.mockResults,
          { id: uid(), name: name.trim(), date, hensachi },
        ],
      },
    }));
    setName("");
  }

  function removeResult(id: string) {
    update((prev) => ({
      ...prev,
      exam: {
        ...prev.exam,
        mockResults: prev.exam.mockResults.filter((r) => r.id !== id),
      },
    }));
  }

  return (
    <div className="rounded-card border border-line bg-white/40 p-5">
      <h3 className="font-display font-bold text-sm mb-3">模試の偏差値推移</h3>

      {chart ? (
        <div className="mb-4">
          <svg viewBox="-4 -8 108 116" className="w-full h-40">
            <polyline
              points={`0,100 ${chart.points.map((p) => `${p.x},${p.y}`).join(" ")} 100,100`}
              fill="#A63D3312"
              stroke="none"
            />
            <path d={chart.path} fill="none" stroke="#A63D33" strokeWidth="1.6" />
            {chart.points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="1.8" fill="#223047" />
            ))}
          </svg>
          <div className="flex justify-between text-[11px] text-inkSoft mt-1">
            <span>{results[0]?.name}</span>
            <span>{results[results.length - 1]?.name}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-inkSoft mb-4">
          模試結果を記録すると、ここに推移グラフが表示されます。
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 mb-3">
        <label className="col-span-1">
          <span className="block text-[11px] text-inkSoft mb-1">模試名</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 五ツ木模試"
            className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm"
          />
        </label>
        <label>
          <span className="block text-[11px] text-inkSoft mb-1">日付</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm"
          />
        </label>
        <label>
          <span className="block text-[11px] text-inkSoft mb-1">偏差値</span>
          <input
            type="number"
            value={hensachi}
            onChange={(e) => setHensachi(Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 font-mono text-sm"
          />
        </label>
      </div>
      <button
        onClick={addResult}
        className="px-5 py-2 rounded-full bg-ink text-paper text-sm font-bold hover:bg-ink/90 transition-colors"
      >
        記録する
      </button>

      {results.length > 0 && (
        <ul className="mt-4 divide-y divide-line/70">
          {[...results].reverse().map((r) => (
            <li key={r.id} className="py-2 flex items-center justify-between text-sm">
              <span>
                {r.name}
                <span className="text-inkSoft ml-2 text-xs">
                  {new Date(r.date).toLocaleDateString("ja-JP", {
                    month: "numeric",
                    day: "numeric",
                  })}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="font-mono font-bold">{r.hensachi}</span>
                <button
                  onClick={() => removeResult(r.id)}
                  className="text-inkSoft hover:text-stamp text-xs"
                  aria-label="削除"
                >
                  削除
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SubjectLogs({
  state,
  update,
}: {
  state: AppState;
  update: (fn: (prev: AppState) => AppState) => void;
}) {
  const [subject, setSubject] = useState("");
  const [minutes, setMinutes] = useState(30);

  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of state.exam.subjectLogs) {
      map.set(log.subject, (map.get(log.subject) ?? 0) + log.minutes);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [state.exam.subjectLogs]);

  const maxTotal = Math.max(1, ...totals.map(([, m]) => m));

  function addLog() {
    if (!subject.trim() || minutes <= 0) return;
    update((prev) => ({
      ...prev,
      exam: {
        ...prev.exam,
        subjectLogs: [
          ...prev.exam.subjectLogs,
          { id: uid(), subject: subject.trim(), minutes, date: todayISO() },
        ],
      },
    }));
    setSubject("");
  }

  return (
    <div className="rounded-card border border-line bg-white/40 p-5">
      <h3 className="font-display font-bold text-sm mb-3">科目別 勉強時間</h3>

      {totals.length > 0 && (
        <div className="space-y-2.5 mb-4">
          {totals.map(([subj, total]) => (
            <div key={subj}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold">{subj}</span>
                <span className="font-mono text-inkSoft">{total}分</span>
              </div>
              <div className="h-2 rounded-full bg-paperDeep overflow-hidden">
                <div
                  className="h-full bg-stamp rounded-full"
                  style={{ width: `${(total / maxTotal) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="例: 英語"
          className="flex-1 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm"
        />
        <input
          type="number"
          min={1}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value) || 0)}
          className="w-20 rounded-lg border border-line bg-paper px-2.5 py-1.5 font-mono text-sm"
        />
        <button
          onClick={addLog}
          className="px-4 py-1.5 rounded-full border border-line text-sm font-bold hover:border-ink/40 transition-colors"
        >
          追加
        </button>
      </div>
    </div>
  );
}

function TodoList({
  state,
  update,
}: {
  state: AppState;
  update: (fn: (prev: AppState) => AppState) => void;
}) {
  const [text, setText] = useState("");
  const todos = state.exam.todos;
  const doneCount = todos.filter((t) => t.done).length;

  function addTodo() {
    if (!text.trim()) return;
    update((prev) => ({
      ...prev,
      exam: {
        ...prev.exam,
        todos: [
          ...prev.exam.todos,
          { id: uid(), text: text.trim(), done: false, createdAt: new Date().toISOString() },
        ],
      },
    }));
    setText("");
  }

  function toggle(id: string) {
    update((prev) => ({
      ...prev,
      exam: {
        ...prev.exam,
        todos: prev.exam.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
      },
    }));
  }

  function remove(id: string) {
    update((prev) => ({
      ...prev,
      exam: { ...prev.exam, todos: prev.exam.todos.filter((t) => t.id !== id) },
    }));
  }

  return (
    <div className="rounded-card border border-line bg-white/40 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-sm">受験までのToDo</h3>
        {todos.length > 0 && (
          <span className="text-xs font-mono text-inkSoft">
            {doneCount}/{todos.length}
          </span>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="例: 英検2級ライティング対策"
          className="flex-1 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm"
        />
        <button
          onClick={addTodo}
          className="px-4 py-1.5 rounded-full bg-ink text-paper text-sm font-bold hover:bg-ink/90 transition-colors"
        >
          追加
        </button>
      </div>

      {todos.length === 0 ? (
        <p className="text-sm text-inkSoft">やることを追加して、一つずつ潰していきましょう。</p>
      ) : (
        <ul className="space-y-1.5">
          {todos.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-paper/60"
            >
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggle(t.id)}
                className="w-4 h-4 accent-stamp"
              />
              <span className={`flex-1 text-sm ${t.done ? "line-through text-inkSoft" : ""}`}>
                {t.text}
              </span>
              <button
                onClick={() => remove(t.id)}
                className="text-inkSoft hover:text-stamp text-xs"
                aria-label="削除"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
