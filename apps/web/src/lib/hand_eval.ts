// Hand evaluator — client-side copy for display purposes
const RANK_MAP: Record<string, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14,
};
const SUIT_MAP: Record<string, number> = { c: 0, d: 1, h: 2, s: 3 };

export function evaluateHand(cards: string[]): [number, number[]] {
  if (!cards || cards.length !== 5) return [0, []];
  const ranks: number[] = [];
  const suits: number[] = [];
  const rankCounts: Record<number, number> = {};
  for (const card of cards) {
    if (!card || card.length < 2) continue;
    const suitCode = card[card.length - 1];
    const rankStr = card.slice(0, -1);
    const rank = rankStr === "10" ? 10 : RANK_MAP[rankStr] || 0;
    const suit = SUIT_MAP[suitCode] || 0;
    ranks.push(rank);
    suits.push(suit);
    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
  }
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const distinct = sorted(Object.keys(rankCounts).map(Number), v => rankCounts[v] * 100 + v, true);
  const sortedRanks = [...new Set(ranks)].sort((a, b) => a - b);

  let straight = false, straightHigh = 0;
  for (let i = 0; i <= sortedRanks.length - 5; i++) {
    if (sortedRanks[i + 4] - sortedRanks[i] === 4) { straight = true; straightHigh = sortedRanks[i + 4]; }
  }
  if (new Set(ranks).size === 5 && sortedRanks.includes(14) && sortedRanks.includes(2) && sortedRanks.includes(3) && sortedRanks.includes(4) && sortedRanks.includes(5)) {
    straight = true; straightHigh = 5;
  }
  const flush = new Set(suits).size === 1;

  if (flush && straight && straightHigh === 5) return [8, [5]];
  if (flush && straight) return [7, [straightHigh]];
  if (counts[0] === 4) return [9, [distinct[0], ...distinct.slice(1)]];
  if (counts[0] === 3 && counts[1] === 2) return [6, [distinct[0], distinct[1]]];
  if (counts[0] === 2 && counts[1] === 2) return [5, [distinct[0], distinct[1], distinct[2]]];
  if (counts[0] === 2) return [4, [distinct[0], ...distinct.slice(1)]];
  return [3, ranks.sort((a, b) => b - a)];
}

function sorted<T>(arr: T[], key: (v: T) => number, reverse = false): T[] {
  return [...arr].sort((a, b) => {
    const ka = key(a), kb = key(b);
    return reverse ? kb - ka : ka - kb;
  });
}

export const HAND_NAMES: Record<number, string> = {
  9: "Tứ Quý", 8: "Sảnh Rồng", 7: "Sảnh", 6: "Ba Túc",
  5: "Bộ Đôi", 4: "Một Đôi", 3: "Mậu Thầu",
};

export function getHandName(rank: number): string {
  return HAND_NAMES[rank] || "Unknown";
}

export function evaluate(cards: string[]): [number, number[]] {
  return evaluateHand(cards);
}

export function evalHand() {
  return { evaluate, getHandName };
}
