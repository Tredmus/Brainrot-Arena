import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatBlock from '../components/StatBlock';
import { Character } from '../types';
import { supabase } from '../lib/supabase';
import { useUser } from '../hooks/useUser';

export default function CharacterView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCharacter() {
      if (!user) return;
      
      try {
        const { data: userCharacter, error: characterError } = await supabase
          .from('user_characters')
          .select(`
            id,
            level,
            experience,
            is_favorite,
            health,
            strength,
            intellect,
            defence,
            characters (
              id,
              name,
              image,
              rarity
            )
          `)
          .eq('character_id', id)
          .eq('user_id', user.id)
          .single();

        if (characterError) throw characterError;

        if (!userCharacter || !userCharacter.characters) {
          setError('Character not found');
          return;
        }

        const formattedCharacter: Character = {
          id: userCharacter.characters.id,
          name: userCharacter.characters.name,
          image: userCharacter.characters.image,
          level: userCharacter.level,
          isFavorite: userCharacter.is_favorite,
          rarity: userCharacter.characters.rarity,
          stats: {
            health: userCharacter.health,
            strength: userCharacter.strength,
            intellect: userCharacter.intellect,
            defence: userCharacter.defence
          },
          equipment: {
            armor: null,
            amulet: null,
            weapon: null
          }
        };

        setCharacter(formattedCharacter);
      } catch (err) {
        console.error('Error loading character:', err);
        setError('Failed to load character data');
      } finally {
        setIsLoading(false);
      }
    }

    loadCharacter();
  }, [id, user]);

  if (isLoading) {
    return (
      <Layout>
        <div className="text-center text-gray-400">Loading character...</div>
      </Layout>
    );
  }

  if (error || !character) {
    return (
      <Layout>
        <div className="text-center text-red-400">{error || 'Character not found'}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Character Header */}
        <div className="flex items-center gap-6 p-6 bg-gray-800 rounded-lg">
          <img
            src={character.image}
            alt={character.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-purple-500"
          />
          <div>
            <h1 className="text-3xl font-bold text-purple-400">{character.name}</h1>
            <div className="text-xl text-gray-400">Level {character.level}</div>
            <div className="text-sm text-gray-500 capitalize">{character.rarity}</div>
          </div>
        </div>

        {/* Character Stats */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Stats</h2>
          <StatBlock stats={character.stats} />
        </div>
      </div>
    </Layout>
  );
}