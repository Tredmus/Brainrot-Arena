import { Character, Equipment, User, InventoryItem } from '../types';

export const mockInventoryItems: InventoryItem[] = [
  {
    id: 'rusty-shank',
    name: 'Rusty Shank of Shame',
    type: 'weapon',
    icon: 'item-images/weapons/rusty-shank.png',
    stats: {
      strength: 10
    },
    rarity: 'common'
  },
  {
    id: 'giga-baton',
    name: 'Giga Chad\'s Baton',
    type: 'weapon',
    icon: 'item-images/weapons/giga-baton.png',
    stats: {
      strength: 20
    },
    rarity: 'rare'
  },
  {
    id: 'crusty-hoodie',
    name: 'Crusty Hoodie',
    type: 'armor',
    icon: 'item-images/armor/crusty-hoodie.png',
    stats: {
      health: 10
    },
    rarity: 'common'
  },
  {
    id: 'tin-foil-hat',
    name: 'Tin Foil Hat',
    type: 'helmet',
    icon: 'item-images/helmets/tin-foil-hat.png',
    stats: {
      intellect: 10
    },
    rarity: 'common'
  },
  {
    id: 'cringe-mittens',
    name: 'Cringe Mittens',
    type: 'gloves',
    icon: 'item-images/gloves/cringe-mittens.png',
    stats: {
      strength: 10
    },
    rarity: 'common'
  },
  {
    id: 'tinfoil-waistband',
    name: 'Tinfoil Waistband',
    type: 'belt',
    icon: 'item-images/belts/tinfoil-waistband.png',
    stats: {
      health: 10
    },
    rarity: 'common'
  },
  {
    id: 'blanket-shame',
    name: 'Blanket of Shame',
    type: 'cloak',
    icon: 'item-images/cloaks/blanket-shame.png',
    stats: {
      dexterity: 10
    },
    rarity: 'common'
  },
  {
    id: 'crocs-copium',
    name: 'Crocs of Copium',
    type: 'boots',
    icon: 'item-images/boots/crocs-copium.png',
    stats: {
      dexterity: 10
    },
    rarity: 'common'
  }
];

export const mockCharacters: Character[] = [
  {
    id: '1',
    name: 'Tralalero Tralala',
    image: 'https://snipboard.io/qNfzVw.jpg',
    level: 5,
    isFavorite: true,
    rarity: 'epic',
    stats: {
      health: 100,
      strength: 75,
      intellect: 60,
      dexterity: 85
    },
    equipment: {
      boots: null,
      belt: null,
      armor: null,
      gloves: null,
      helmet: null,
      amulet: null,
      cloak: null,
      weapon: null
    }
  },
  {
    id: '2',
    name: 'Tung Tung Tung Sahur',
    image: 'https://snipboard.io/IRygoU.jpg',
    level: 3,
    isFavorite: false,
    rarity: 'rare',
    stats: {
      health: 80,
      strength: 45,
      intellect: 95,
      dexterity: 65
    },
    equipment: {
      boots: null,
      belt: null,
      armor: null,
      gloves: null,
      helmet: null,
      amulet: null,
      cloak: null,
      weapon: null
    }
  },
  {
    id: '3',
    name: 'Lirili Larila',
    image: 'https://snipboard.io/K1M2Ii.jpg',
    level: 4,
    isFavorite: false,
    rarity: 'legendary',
    stats: {
      health: 90,
      strength: 65,
      intellect: 75,
      dexterity: 80
    },
    equipment: {
      boots: null,
      belt: null,
      armor: null,
      gloves: null,
      helmet: null,
      amulet: null,
      cloak: null,
      weapon: null
    }
  }
];

export const mockUser: User = {
  id: '1',
  email: 'user@example.com',
  username: 'BrainRotMaster',
  currencies: {
    gold: 1000,
    rottenBrains: 50,
    energy: {
      current: 50,
      max: 50
    }
  },
  characters: mockCharacters
};