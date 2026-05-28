import { v4 as uuidv4 } from "uuid";

const PLAYER_ID_KEY = "lieng_player_id";
const PLAYER_NAME_KEY = "lieng_player_name";
const RULES_ACCEPTED_KEY = "lieng_rules_accepted";

const ADJECTIVES = ["Hồng", "Xanh", "Vàng", "Tím", "Hổ", "Rồng", "Tiên", "Quỷ", "Lân", "Phượng"];
const NOUNS = ["Mai", "Lan", "Hùng", "Minh", "Phượng", "Long", "Gấu", "Mèo", "Hương", "Trang"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getOrCreatePlayerName(): string {
  if (typeof window === "undefined") return "Anonymous";
  let name = localStorage.getItem(PLAYER_NAME_KEY);
  if (!name || name === "Anonymous") {
    const adj = randomItem(ADJECTIVES);
    const noun = randomItem(NOUNS);
    name = `${adj} ${noun}`;
    localStorage.setItem(PLAYER_NAME_KEY, name);
  }
  return name;
}

export function setPlayerName(name: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(PLAYER_NAME_KEY, name);
  }
}

export function isRulesAccepted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(RULES_ACCEPTED_KEY) === "true";
}

export function acceptRules() {
  if (typeof window !== "undefined") {
    localStorage.setItem(RULES_ACCEPTED_KEY, "true");
  }
}
