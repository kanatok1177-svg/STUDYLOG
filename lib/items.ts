import { ItemId } from "./types";

export interface ItemDef {
  id: ItemId;
  name: string;
  description: string;
  price: number; // 必要な貯金(分)
  icon: string; // 判子に刻む一文字
}

export const ITEMS: ItemDef[] = [
  {
    id: "streak-revive",
    name: "ストリーク復活",
    description: "連続記録を過去の最高記録まで回復します(学習履歴は変わりません)",
    price: 180,
    icon: "復",
  },
  {
    id: "interest-skip",
    name: "利息無効チケット",
    description: "次に発生する借金の利息を1回分無効にします",
    price: 60,
    icon: "免",
  },
  {
    id: "miss-ticket",
    name: "見逃しチケット",
    description: "1週間チャレンジ中、未達成の日を1日だけ達成扱いにできます",
    price: 120,
    icon: "逃",
  },
  {
    id: "xp-boost",
    name: "XPブースト",
    description: "次の集中セッション1回分のXPが2倍になります",
    price: 45,
    icon: "倍",
  },
  {
    id: "rest-day",
    name: "休養券",
    description: "今日の目標を免除し、未達成でも借金が発生しません",
    price: 90,
    icon: "休",
  },
  {
    id: "away-reset",
    name: "離席帳消し券",
    description: "直近の集中セッションの離席回数を0にします",
    price: 30,
    icon: "消",
  },
  {
    id: "goal-change",
    name: "目標時間変更券",
    description: "日次目標を変更できるようにします(通常は変更不可)",
    price: 100,
    icon: "変",
  },
];

export function getItemDef(id: ItemId): ItemDef {
  const def = ITEMS.find((i) => i.id === id);
  if (!def) throw new Error(`unknown item: ${id}`);
  return def;
}
