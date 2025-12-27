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
