import { BattleCharacter, BattleLog, BattleState, CharacterSkill } from '../types';
import { getCharacterSkill, canUseSkill } from './skillUtils';

export const calculateDamage = (attacker: BattleCharacter, defender: BattleCharacter): { 
  damage: number;
  isCrit: boolean;
  isMiss: boolean;
} => {
  // Check if defender is stunned
  if (defender.isStunned) {
    return { damage: 0, isCrit: false, isMiss: true };
  }

  // Get base dodge chance from defender's defence
  let dodgeChance = defender.stats.defence * 0.001;
  
  // Add dodge bonus from active effects
  const dodgeEffects = defender.activeEffects.filter(e => e.type === 'dodge_boost');
  dodgeEffects.forEach(effect => {
    dodgeChance += effect.value / 100;
  });

  if (Math.random() < dodgeChance) {
    return { damage: 0, isCrit: false, isMiss: true };
  }

  // Calculate base damage
  let damage = attacker.stats.strength * 0.8;

  // Add equipment bonuses if they exist
  if (attacker.equipment) {
    // Add weapon damage if equipped
    if (attacker.equipment.weapon?.stats?.strength) {
      damage += attacker.equipment.weapon.stats.strength;
    }
    
    // Add other equipment bonuses
    Object.values(attacker.equipment).forEach(item => {
      if (item?.stats?.strength) {
        damage += item.stats.strength;
      }
    });
  }

  // Calculate crit chance
  let critChance = attacker.stats.intellect * 0.002;
  
  // Add crit bonus from active effects
  const critEffects = attacker.activeEffects.filter(e => e.type === 'crit_boost');
  critEffects.forEach(effect => {
    critChance += effect.value / 100;
  });

  const isCrit = Math.random() < critChance;
  if (isCrit) {
    damage *= 1.5;
  }

  // Apply damage boost effects
  const damageBoosts = attacker.activeEffects.filter(e => e.type === 'damage_boost');
  damageBoosts.forEach(effect => {
    damage *= (1 + effect.value / 100);
  });

  // Apply damage reduction effects on defender
  const damageReductions = defender.activeEffects.filter(e => e.type === 'damage_reduction');
  damageReductions.forEach(effect => {
    damage *= (1 - effect.value / 100);
  });

  // Apply defender's defence stat
  const defenceReduction = defender.stats.defence * 0.002; // 0.2% damage reduction per point of defence
  damage *= (1 - defenceReduction);

  return {
    damage: Math.round(damage),
    isCrit,
    isMiss: false
  };
};

export const createBattleLog = (
  type: BattleLog['type'],
  message: string
): BattleLog => ({
  id: Math.random().toString(36).substr(2, 9),
  message,
  type,
  timestamp: Date.now()
});

export const initializeBattleCharacter = (
  character: BattleCharacter,
  team: 'player' | 'enemy'
): BattleCharacter => {
  const skill = getCharacterSkill(character.name);
  return {
    ...character,
    currentHp: character.stats.health,
    maxHp: character.stats.health,
    team,
    isDefeated: false,
    isStunned: false,
    activeEffects: [],
    equipment: {
      boots: null,
      belt: null,
      armor: null,
      gloves: null,
      helmet: null,
      amulet: null,
      cloak: null,
      weapon: null
    },
    skill: skill ? {
      ...skill,
      currentCooldown: 0,
      remainingUses: skill.usesPerBattle
    } : null
  };
};

export const determineNextTurn = (state: BattleState): number => {
  const allCharacters = [...state.playerTeam, ...state.enemyTeam];
  let nextIndex = (state.currentTurn + 1) % allCharacters.length;
  let character = allCharacters[nextIndex];
  
  // Skip defeated or stunned characters
  while (character.isDefeated || character.isStunned) {
    nextIndex = (nextIndex + 1) % allCharacters.length;
    character = allCharacters[nextIndex];
  }

  return nextIndex;
};

export const checkBattleEnd = (state: BattleState): {
  isFinished: boolean;
  winner: 'player' | 'enemy' | null;
} => {
  const playerDefeated = state.playerTeam.every(char => char.isDefeated);
  const enemyDefeated = state.enemyTeam.every(char => char.isDefeated);

  if (playerDefeated || enemyDefeated) {
    return {
      isFinished: true,
      winner: playerDefeated ? 'enemy' : 'player'
    };
  }

  return {
    isFinished: false,
    winner: null
  };
};

export const applySkillEffect = (
  character: BattleCharacter,
  state: BattleState
): { state: BattleState; logs: BattleLog[] } => {
  // If character has no skill or skill is not ready, return current state
  if (!character.skill || !canUseSkill(character.skill)) {
    return { 
      state,
      logs: [createBattleLog('skill', `${character.name} cannot use their skill right now.`)]
    };
  }

  const skill = character.skill;
  const newState = { ...state };
  const logs: BattleLog[] = [];

  // Determine targets based on skill effect target
  const targets = (() => {
    if (!skill.effect || !skill.effect.target) {
      return [];
    }

    switch (skill.effect.target) {
      case 'self':
        return [character];
      case 'all_allies':
        return character.team === 'player' ? newState.playerTeam : newState.enemyTeam;
      case 'all_enemies':
        return character.team === 'player' ? newState.enemyTeam : newState.playerTeam;
      case 'single_enemy': {
        const enemyTeam = character.team === 'player' ? newState.enemyTeam : newState.playerTeam;
        const aliveEnemies = enemyTeam.filter(c => !c.isDefeated);
        return aliveEnemies.length > 0 ? [aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]] : [];
      }
      default:
        return [];
    }
  })();

  if (targets.length === 0) {
    return {
      state,
      logs: [createBattleLog('skill', `${character.name}'s ${skill.name} had no valid targets.`)]
    };
  }

  // Create effect message
  let effectMessage = `${character.name} uses ${skill.name}! `;

  // Apply effect based on type
  if (skill.type && skill.effect) {
    switch (skill.type) {
      case 'damage_boost':
      case 'dodge_boost':
      case 'damage_reduction':
      case 'crit_boost': {
        const value = typeof skill.effect.value === 'number' 
          ? skill.effect.value 
          : Math.floor(Math.random() * (skill.effect.value[1] - skill.effect.value[0] + 1)) + skill.effect.value[0];
        
        targets.forEach(target => {
          if (!target.isDefeated) {
            target.activeEffects.push({
              type: skill.type,
              value,
              duration: skill.duration,
              source: skill.name
            });
          }
        });
        effectMessage += `Applies ${skill.description}`;
        break;
      }
      case 'stun': {
        targets.forEach(target => {
          if (!target.isDefeated && Math.random() < (skill.effect.chance || 0) / 100) {
            target.isStunned = true;
            effectMessage += `${target.name} is stunned! `;
          }
        });
        break;
      }
      case 'dot':
      case 'poison': {
        const value = typeof skill.effect.value === 'number'
          ? skill.effect.value
          : Math.floor(Math.random() * (skill.effect.value[1] - skill.effect.value[0] + 1)) + skill.effect.value[0];
        
        targets.forEach(target => {
          if (!target.isDefeated) {
            target.activeEffects.push({
              type: skill.type,
              value,
              duration: skill.duration,
              source: skill.name
            });
          }
        });
        effectMessage += `Applies ${skill.description}`;
        break;
      }
      case 'heal':
      case 'restore': {
        const value = typeof skill.effect.value === 'number'
          ? skill.effect.value
          : Math.floor(Math.random() * (skill.effect.value[1] - skill.effect.value[0] + 1)) + skill.effect.value[0];
        
        targets.forEach(target => {
          if (!target.isDefeated) {
            const healing = Math.round(target.maxHp * (value / 100));
            target.currentHp = Math.min(target.maxHp, target.currentHp + healing);
            effectMessage += `${target.name} recovers ${healing} HP! `;
          }
        });
        break;
      }
      case 'instant_damage': {
        const value = typeof skill.effect.value === 'number'
          ? skill.effect.value
          : Math.floor(Math.random() * (skill.effect.value[1] - skill.effect.value[0] + 1)) + skill.effect.value[0];
        
        targets.forEach(target => {
          if (!target.isDefeated) {
            const damage = Math.round(target.maxHp * (value / 100));
            target.currentHp = Math.max(0, target.currentHp - damage);
            if (target.currentHp === 0) {
              target.isDefeated = true;
              logs.push(createBattleLog('defeat', `${target.name} has been defeated!`));
            }
            effectMessage += `${target.name} takes ${damage} damage! `;
          }
        });
        break;
      }
    }
  }

  // Update skill state
  character.skill.currentCooldown = character.skill.cooldown;
  if (character.skill.usesPerBattle && character.skill.remainingUses) {
    character.skill.remainingUses--;
  }

  // Add log entry
  logs.unshift(createBattleLog('skill', effectMessage));

  return { state: newState, logs };
};