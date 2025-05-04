import { CharacterSkill, SkillType, SkillEffect } from '../types';

export const characterSkills: Record<string, CharacterSkill> = {
  'Blue Lobster': {
    name: 'Deadly Claw',
    description: 'Next round all your character\'s attacks deal 20% more damage',
    type: 'damage_boost',
    cooldown: 5,
    currentCooldown: 0,
    effect: {
      value: 20,
      target: 'all_allies',
    },
    duration: 1,
    usesPerBattle: 2
  },
  'Tralalero Tralala': {
    name: 'Tsunami Sneaker',
    description: 'Next round all your opponent characters have 10% to get stunned',
    type: 'stun',
    cooldown: 4,
    currentCooldown: 0,
    effect: {
      value: 10,
      target: 'all_enemies',
      chance: 10
    },
    duration: 1,
    usesPerBattle: 2
  },
  'Bombardino coccodrillo': {
    name: 'Nuclear Missile',
    description: 'All opponent\'s characters receive 3% damage out of max hp, for 3 rounds',
    type: 'dot',
    cooldown: 6,
    currentCooldown: 0,
    effect: {
      value: 3,
      target: 'all_enemies'
    },
    duration: 3,
    usesPerBattle: 1
  },
  'Tung Tung Tung Sahur': {
    name: 'Knockout Bat',
    description: 'One of your enemy characters falls unconscious and lose it\'s turn',
    type: 'knockout',
    cooldown: 5,
    currentCooldown: 0,
    effect: {
      value: 1,
      target: 'single_enemy'
    },
    duration: 1,
    usesPerBattle: 2
  },
  'Lirili Larila': {
    name: 'Stomp of Doom',
    description: 'All enemy characters receive 7-10% damage out of max hp next round',
    type: 'instant_damage',
    cooldown: 4,
    currentCooldown: 0,
    effect: {
      value: [7, 10],
      target: 'all_enemies'
    },
    duration: 1,
    usesPerBattle: 2
  },
  'Brr brr Patapim': {
    name: 'Roots of Moods',
    description: 'All your characters receive 5-12% health out of max hp next round',
    type: 'heal',
    cooldown: 4,
    currentCooldown: 0,
    effect: {
      value: [5, 12],
      target: 'all_allies'
    },
    duration: 1,
    usesPerBattle: 2
  },
  'Bombombini Gusini': {
    name: 'Speed Turbine',
    description: 'Raises your character\'s dodge chance with 30% next round',
    type: 'dodge_boost',
    cooldown: 3,
    currentCooldown: 0,
    effect: {
      value: 30,
      target: 'all_allies'
    },
    duration: 1,
    usesPerBattle: 3
  },
  'La vaca saturno saturnita': {
    name: 'Ring of Dust',
    description: 'Received damage of your characters is reduced by 50% for 2 rounds',
    type: 'damage_reduction',
    cooldown: 5,
    currentCooldown: 0,
    effect: {
      value: 50,
      target: 'all_allies'
    },
    duration: 2,
    usesPerBattle: 2
  },
  'Capuchino Assassino': {
    name: 'Slash of Samurai',
    description: 'Next two hits of this character are critical strikes',
    type: 'crit_boost',
    cooldown: 4,
    currentCooldown: 0,
    effect: {
      value: 100,
      target: 'self'
    },
    duration: 2,
    usesPerBattle: 2
  },
  'Ballerina Capuchina': {
    name: 'Magic Dance',
    description: 'Raises all your characters critical hit chance with 50% next round',
    type: 'crit_boost',
    cooldown: 4,
    currentCooldown: 0,
    effect: {
      value: 50,
      target: 'all_allies'
    },
    duration: 1,
    usesPerBattle: 2
  },
  'Trulimero Trulicina': {
    name: 'Fish scales',
    description: 'Raises all your characters dodge change with 50% next round',
    type: 'dodge_boost',
    cooldown: 4,
    currentCooldown: 0,
    effect: {
      value: 50,
      target: 'all_allies'
    },
    duration: 1,
    usesPerBattle: 2
  },
  'Trippi Troppi': {
    name: 'Fishy Breath',
    description: 'Poison all your characters for 8-13% health out of max hp for 2 rounds',
    type: 'poison',
    cooldown: 4,
    currentCooldown: 0,
    effect: {
      value: [8, 13],
      target: 'all_enemies'
    },
    duration: 2,
    usesPerBattle: 2
  },
  'Chimpanzini Bananini': {
    name: 'Monkey Business',
    description: 'Shimpanzini bananini eat a banana and restores 50% of maximum health',
    type: 'restore',
    cooldown: 5,
    currentCooldown: 0,
    effect: {
      value: 50,
      target: 'self'
    },
    duration: 1,
    usesPerBattle: 1
  }
};

export function getCharacterSkill(characterName: string): CharacterSkill | undefined {
  return characterSkills[characterName];
}

export function canUseSkill(skill: CharacterSkill): boolean {
  return skill.currentCooldown === 0 && 
         (!skill.usesPerBattle || (skill.remainingUses && skill.remainingUses > 0));
}

export function updateSkillCooldowns(skills: CharacterSkill[]): void {
  skills.forEach(skill => {
    if (skill.currentCooldown > 0) {
      skill.currentCooldown--;
    }
  });
}