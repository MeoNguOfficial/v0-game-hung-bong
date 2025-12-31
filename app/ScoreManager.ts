export type Difficulty = "normal" | "hardcode" | "sudden_death";
export type GameType = "default" | "classic";

export interface Modifiers {
  isHidden: boolean;
  isBlank: boolean;
  isReverse: boolean;
}

export const getScoreKey = (difficulty: Difficulty, gameType: GameType, modifiers: Modifiers): string => {
  const parts: string[] = [difficulty, gameType];
  if (modifiers.isHidden) parts.push("h");
  if (modifiers.isBlank) parts.push("b");
  if (modifiers.isReverse) parts.push("r");
  
  // Sắp xếp các modifier để key luôn nhất quán (ví dụ: h_b_r thay vì b_h_r)
  const modifierKey = parts.slice(2).sort().join('_');
  
  return `best_score_${parts[0]}_${parts[1]}${modifierKey ? `_${modifierKey}` : ''}`;
};

export const getModifierCombinationText = (modifiers: Modifiers, t: any): string => {
  const active: string[] = [];
  if (modifiers.isHidden) active.push(t.miscHidden || "Hidden");
  if (modifiers.isBlank) active.push(t.miscBlank || "Blank");
  if (modifiers.isReverse) active.push(t.miscReverse || "Reverse");

  if (active.length === 0) {
    return t.none || "None";
  }
  return active.join(" + ");
};

export const MODIFIER_COMBINATIONS: Modifiers[] = [
  { isHidden: false, isBlank: false, isReverse: false },
  { isHidden: true,  isBlank: false, isReverse: false },
  { isHidden: false, isBlank: true,  isReverse: false },
  { isHidden: false, isBlank: false, isReverse: true  },
  { isHidden: true,  isBlank: true,  isReverse: false },
  { isHidden: true,  isBlank: false, isReverse: true  },
  { isHidden: false, isBlank: true,  isReverse: true  },
  { isHidden: true,  isBlank: true,  isReverse: true  },
];

export const DIFFICULTIES: Difficulty[] = ["normal", "hardcode", "sudden_death"];
export const GAME_TYPES: GameType[] = ["default", "classic"];

export const initializeScores = (): Record<string, number> => {
  const scores: Record<string, number> = {};
  DIFFICULTIES.forEach(diff => {
    GAME_TYPES.forEach(type => {
      MODIFIER_COMBINATIONS.forEach(mods => {
        const key = getScoreKey(diff, type, mods);
        scores[key] = 0;
      });
    });
  });
  return scores;
};

// Explicit multiplier tables for clarity and easy adjustments
export const GAME_TYPE_MULTIPLIER: Record<GameType, number> = {
  default: 1.0,
  classic: 1.0,
};

export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  normal: 1.0,
  hardcode: 1.5,
  sudden_death: 2.0,
};

const MODIFIER_MULTIPLIERS: Record<string, number> = {
  '': 1.0,
  'h': 1.1,
  'b': 1.2,
  'r': 1.3,
  'h_b': 1.4,
  'h_r': 1.5,
  'b_r': 1.6,
  'h_b_r': 1.7,
};

export const getScoreMultiplier = (
  difficulty: Difficulty,
  gameType: GameType,
  modifiers: Modifiers,
  isFunny: boolean
): number => {
  // Score = Base * GameTypeMultiplier * DifficultyMultiplier * ModifiersMultiplier * (Funny ? 1.1 : 1)

  let multiplier = 1.0;

  // Game Type
  multiplier *= GAME_TYPE_MULTIPLIER[gameType] ?? 1.0;

  // Difficulty
  multiplier *= DIFFICULTY_MULTIPLIER[difficulty] ?? 1.0;

  // Modifiers (build a consistent key from h/b/r in that order)
  const parts: string[] = [];
  if (modifiers.isHidden) parts.push('h');
  if (modifiers.isBlank) parts.push('b');
  if (modifiers.isReverse) parts.push('r');
  const modifierKey = parts.join('_');
  multiplier *= MODIFIER_MULTIPLIERS[modifierKey] ?? 1.0;

  // Funny modes increase score
  if (isFunny) multiplier *= 1.1;

  return multiplier;
};

export interface FunnyModes {
  isReverseControl: boolean;
  isMirror: boolean;
  isInvisible: boolean;
}

export interface HistoryEntry {
  score: number;
  timestamp: number;
  difficulty: Difficulty;
  gameType: GameType;
  modifiers: Modifiers;
  funny: FunnyModes;
}
