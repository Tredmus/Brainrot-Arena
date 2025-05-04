import { createClient } from 'npm:@supabase/supabase-js@2.39.8';

interface ChestConfig {
  minPrizes: number;
  maxPrizes: number;
  prizes: {
    type: 'character';
    weight: number;
    rarities: string[];
  }[];
}

const chestConfigs: Record<string, ChestConfig> = {
  bronze: {
    minPrizes: 1,
    maxPrizes: 1,
    prizes: [
      { type: 'character', weight: 65, rarities: ['common'] },
      { type: 'character', weight: 25, rarities: ['rare'] },
      { type: 'character', weight: 10, rarities: ['epic'] }
    ]
  },
  silver: {
    minPrizes: 1,
    maxPrizes: 2,
    prizes: [
      { type: 'character', weight: 48, rarities: ['common'] },
      { type: 'character', weight: 35, rarities: ['rare'] },
      { type: 'character', weight: 15, rarities: ['epic'] },
      { type: 'character', weight: 2, rarities: ['legendary'] }
    ]
  },
  gold: {
    minPrizes: 2,
    maxPrizes: 3,
    prizes: [
      { type: 'character', weight: 20, rarities: ['common'] },
      { type: 'character', weight: 34, rarities: ['rare'] },
      { type: 'character', weight: 35, rarities: ['epic'] },
      { type: 'character', weight: 10, rarities: ['legendary'] },
      { type: 'character', weight: 1, rarities: ['mythic'] }
    ]
  },
  ruby: {
    minPrizes: 3,
    maxPrizes: 4,
    prizes: [
      { type: 'character', weight: 25, rarities: ['rare'] },
      { type: 'character', weight: 55, rarities: ['epic'] },
      { type: 'character', weight: 15, rarities: ['legendary'] },
      { type: 'character', weight: 5, rarities: ['mythic'] }
    ]
  },
  diamond: {
    minPrizes: 4,
    maxPrizes: 7,
    prizes: [
      { type: 'character', weight: 60, rarities: ['epic'] },
      { type: 'character', weight: 30, rarities: ['legendary'] },
      { type: 'character', weight: 10, rarities: ['mythic'] }
    ]
  },
  tralalero: {
    minPrizes: 1,
    maxPrizes: 1,
    prizes: [
      { type: 'character', weight: 100, rarities: ['epic'] }
    ]
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const chestType = url.searchParams.get('type');

    if (!chestType || !chestConfigs[chestType]) {
      return new Response(
        JSON.stringify({ error: 'Invalid chest type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Special handling for Tralalero chest
    if (chestType === 'tralalero') {
      const { data: tralalero, error: tralaleroError } = await supabaseClient
        .from('characters')
        .select('*')
        .eq('name', 'Tralalero Tralala')
        .single();

      if (tralaleroError) throw tralaleroError;

      return new Response(
        JSON.stringify({
          rewards: [{
            type: 'character',
            id: tralalero.id,
            name: tralalero.name,
            rarity: tralalero.rarity,
            image: tralalero.image,
            description: tralalero.description
          }]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all available characters
    const { data: allCharacters, error: charError } = await supabaseClient
      .from('characters')
      .select('*')
      .neq('name', 'Tralalero Tralala');

    if (charError) throw charError;

    // Get user's owned characters
    const { data: userCharacters } = await supabaseClient
      .from('user_characters')
      .select('character_id')
      .eq('user_id', user.id);

    const ownedCharacterIds = userCharacters?.map(uc => uc.character_id) || [];

    const config = chestConfigs[chestType];
    const numPrizes = config.minPrizes + Math.floor(Math.random() * (config.maxPrizes - config.minPrizes + 1));
    const rewards = [];

    // For each prize draw
    for (let i = 0; i < numPrizes; i++) {
      // Select rarity based on weights
      const totalWeight = config.prizes.reduce((sum, p) => sum + p.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedPrize;

      for (const prize of config.prizes) {
        random -= prize.weight;
        if (random <= 0) {
          selectedPrize = prize;
          break;
        }
      }

      if (!selectedPrize) continue;

      // Get available characters for the selected rarity
      const availableCharacters = allCharacters?.filter(char => 
        selectedPrize.rarities.includes(char.rarity) && 
        !ownedCharacterIds.includes(char.id)
      );

      if (availableCharacters && availableCharacters.length > 0) {
        // Select random character from available ones
        const character = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
        rewards.push({
          type: 'character',
          id: character.id,
          name: character.name,
          rarity: character.rarity,
          image: character.image,
          description: character.description
        });
        // Add to owned characters to prevent duplicates in same chest
        ownedCharacterIds.push(character.id);
      }
    }

    return new Response(
      JSON.stringify({ rewards }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});