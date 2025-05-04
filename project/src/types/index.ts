export interface Character {
  id: string;
  name: string;
  image: string;
  sound_effect?: string;
  level: number;
  experience: number;
  description?: string;
  isFavorite?: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  stats: {
    health: number;
    strength: number;
    intellect: number;
    defence: number;
  };
  baseStats: {
    health: number;
    strength: number;
    intellect: number;
    defence: number;
  };
  equipment: {
    boots: Equipment | null;
    belt: Equipment | null;
    armor: Equipment | null;
    gloves: Equipment | null;
    helmet: Equipment | null;
    amulet: Equipment | null;
    cloak: Equipment | null;
    weapon: Equipment | null;
  };
  skill?: CharacterSkill;
}

export interface CharacterSkill {
  name: string;
  description: string;
  type: SkillType;
  cooldown: number;
  currentCooldown: number;
  effect: SkillEffect;
  duration: number;
  usesPerBattle?: number;
  remainingUses?: number;
}

export type SkillType = 
  | 'damage_boost'     // Increases damage
  | 'stun'             // Chance to stun
  | 'dot'              // Damage over time
  | 'knockout'         // Skip turn
  | 'instant_damage'   // Immediate damage
  | 'heal'            // Healing
  | 'dodge_boost'     // Increase dodge
  | 'damage_reduction' // Reduce incoming damage
  | 'crit_boost'      // Increase crit chance
  | 'poison'          // Poison damage
  | 'restore';        // Health restore

export interface SkillEffect {
  value: number | [number, number]; // Single value or range [min, max]
  target: 'all_allies' | 'all_enemies' | 'single_enemy' | 'self';
  chance?: number;    // For effects with probability
}

export interface Equipment {
  id: string;
  name: string;
  type: 'boots' | 'belt' | 'armor' | 'gloves' | 'helmet' | 'amulet' | 'cloak' | 'weapon';
  stats: Partial<Character['stats']>;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
}

export interface Consumable {
  id: string;
  name: string;
  description: string;
  icon: string;
  effectType: 'heal' | 'buff' | 'revive';
  effectValue: number;
  effectDuration?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  quantity: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  currencies: {
    gold: number;
    rottenBrains: number;
    energy: {
      current: number;
      max: number;
    };
  };
  characters: Character[];
}

export interface InventoryItem extends Equipment {
  icon: string;
}

export type SortOption = 'favorites' | 'name' | 'level' | 'rarity';

export interface BattleCharacter extends Character {
  currentHp: number;
  maxHp: number;
  team: 'player' | 'enemy';
  isDefeated: boolean;
  isStunned?: boolean;
  activeEffects: BattleEffect[];
}

export interface BattleEffect {
  type: string;
  value: number;
  duration: number;
  source: string;
}

export interface BattleLog {
  id: string;
  message: string;
  type: 'attack' | 'crit' | 'miss' | 'defeat' | 'victory' | 'skill';
  timestamp: number;
}

export interface BattleState {
  playerTeam: BattleCharacter[];
  enemyTeam: BattleCharacter[];
  turnOrder: BattleCharacter[];
  currentTurnIndex: number;
  logs: BattleLog[];
  isFinished: boolean;
  winner: 'player' | 'enemy' | null;
}

export interface BattleTeam {
  id: string;
  userId: string;
  character1Id: string;
  character2Id: string;
  character3Id: string;
  createdAt: string;
  updatedAt: string;
}