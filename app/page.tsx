"use client";

import { useEffect, useState } from "react";
import { useAppState } from "@/lib/storage";
import { TabNav, TabKey } from "@/components/TabNav";
import { Dashboard } from "@/components/Dashboard";
import { FocusLab } from "@/components/FocusLab";
import { BankVault } from "@/components/BankVault";
import { ExamStudy } from "@/components/ExamStudy";
import { BankLogo } from "@/components/BankLogo";
import { OnboardingModal } from "@/components/OnboardingModal";
import { registerNotificationServiceWorker } from "@/lib/notify";

export default function Home() {
  const { state, update, hydrated } = useAppState();
  const [tab, setTab] = useState<TabKey>("dashboard");

  useEffect(() => {
    registerNotificationServiceWorker();
  }, []);

  return (
    <main className="min-h-screen">
      {hydrated && !state.onboarded && <OnboardingModal update={update} />}

      <header className="px-5 pt-8 pb-2 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <BankLogo size={34} />
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <h1 className="font-display text-2xl font-extrabold tracking-tight">
                勉強銀行
              </h1>
              <span className="text-[11px] font-mono text-inkSoft">NextK Lab</span>
            </div>
            <p className="text-xs text-inkSoft mt-1">
              集中・貯金・受験対策を、ひとつの帳簿に。
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto sticky top-0 z-10 bg-paperDeep/0 pt-3">
        <TabNav active={tab} onChange={setTab} />
      </div>

      <div className="max-w-lg mx-auto px-4 pb-16 pt-5 bg-paper rounded-t-card min-h-[60vh]">
        {!hydrated ? (
          <div className="py-24 text-center text-sm text-inkSoft">読み込み中…</div>
        ) : (
          <>
            {tab === "dashboard" && <Dashboard state={state} onNavigate={setTab} />}
            {tab === "focus" && <FocusLab state={state} update={update} />}
            {tab === "savings" && <BankVault state={state} update={update} />}
            {tab === "exam" && <ExamStudy state={state} update={update} />}
          </>
        )}
      </div>

      <footer className="max-w-lg mx-auto px-5 py-6 text-center text-[11px] text-inkSoft">
        データはこの端末のブラウザにのみ保存されます
      </footer>
    </main>
  );
}
