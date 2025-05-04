import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Swords, ArrowUpDown, Volume2, VolumeX, Volume1, Gift, Users, Trophy, Sparkles } from 'lucide-react';
import Layout from '../components/Layout';
import CharacterCard from '../components/CharacterCard';
import { Character, SortOption } from '../types';
import { supabase } from '../lib/supabase';
import { useUser } from '../hooks/useUser';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoading: isLoadingUser, error: userError } = useUser();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('favorites');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [rarityFilter, setRarityFilter] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'>('all');

  useEffect(() => {
    async function loadUserPreferences() {
      if (!user) return;

      try {
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (preferences) {
          setSoundEnabled(preferences.sound_enabled);
          setVolume(preferences.volume);
          setSortBy(preferences.sort_by as SortOption);
          setRarityFilter(preferences.rarity_filter as typeof rarityFilter);
          setSortDirection(preferences.sort_direction as 'asc' | 'desc');
        }
      } catch (err) {
        console.error('Error loading preferences:', err);
      }
    }

    loadUserPreferences();
  }, [user]);

  useEffect(() => {
    async function loadCharacters() {
      if (!user) return;

      try {
        const { data: userCharacters, error: charactersError } = await supabase
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
              description,
              rarity,
              sound_effect,
              base_health,
              base_strength,
              base_intellect,
              base_defence
            )
          `)
          .eq('user_id', user.id);

        if (charactersError) throw charactersError;

        if (!userCharacters) return;

        const formattedCharacters: Character[] = userCharacters
          .filter(uc => uc.characters) // Filter out any null characters
          .map(uc => ({
            id: uc.characters.id,
            name: uc.characters.name,
            image: uc.characters.image,
            sound_effect: uc.characters.sound_effect,
            level: uc.level,
            experience: uc.experience,
            description: uc.characters.description,
            isFavorite: uc.is_favorite,
            rarity: uc.characters.rarity,
            stats: {
              health: uc.health,
              strength: uc.strength,
              intellect: uc.intellect,
              defence: uc.defence
            },
            baseStats: {
              health: uc.characters.base_health,
              strength: uc.characters.base_strength,
              intellect: uc.characters.base_intellect,
              defence: uc.characters.base_defence
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
          }));

        setCharacters(formattedCharacters);
      } catch (err) {
        console.error('Error loading characters:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCharacters();
  }, [user]);

  useEffect(() => {
    async function savePreferences() {
      if (!user) return;

      try {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            sound_enabled: soundEnabled,
            volume: volume,
            sort_by: sortBy,
            rarity_filter: rarityFilter,
            sort_direction: sortDirection
          });

        if (error) throw error;
      } catch (err) {
        console.error('Error saving preferences:', err);
      }
    }

    savePreferences();
  }, [user, soundEnabled, volume, sortBy, rarityFilter, sortDirection]);

  const handleToggleFavorite = async (characterId: string) => {
    if (!user) return;

    try {
      const character = characters.find(c => c.id === characterId);
      if (!character) return;

      const { error } = await supabase
        .from('user_characters')
        .update({ is_favorite: !character.isFavorite })
        .eq('user_id', user.id)
        .eq('character_id', characterId);

      if (error) throw error;

      setCharacters(prev =>
        prev.map(c =>
          c.id === characterId
            ? { ...c, isFavorite: !c.isFavorite }
            : c
        )
      );
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    const volumeSlider = document.getElementById('volume-slider');
    const volumeButton = document.getElementById('volume-button');

    if (
      volumeSlider &&
      volumeButton &&
      !volumeSlider.contains(event.target as Node) &&
      !volumeButton.contains(event.target as Node)
    ) {
      setShowVolumeSlider(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const sortedAndFilteredCharacters = [...characters]
    .filter(char => {
      const nameMatch = char.name.toLowerCase().includes(searchQuery.toLowerCase());
      const rarityMatch = rarityFilter === 'all' || char.rarity === rarityFilter;
      return nameMatch && rarityMatch;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'favorites':
          comparison = Number(b.isFavorite) - Number(a.isFavorite);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'level':
          comparison = b.level - a.level;
          break;
        case 'rarity': {
          const rarityOrder = {
            common: 0,
            rare: 1,
            epic: 2,
            legendary: 3,
            mythic: 4
          };
          comparison = rarityOrder[b.rarity] - rarityOrder[a.rarity];
          break;
        }
      }

      return sortDirection === 'asc' ? -comparison : comparison;
    });

  if (isLoadingUser || !user) {
    return (
      <Layout>
        <div className="text-center text-gray-400">Loading...</div>
      </Layout>
    );
  }

  if (userError) {
    return (
      <Layout>
        <div className="text-center text-red-400">{userError}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Characters</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                id="volume-button"
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors relative"
              >
                {soundEnabled ? (
                  volume > 0.5 ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <Volume1 className="w-5 h-5" />
                  )
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </button>

              {showVolumeSlider && (
                <div
                  id="volume-slider"
                  className="absolute right-0 top-12 bg-gray-800 p-4 rounded-lg shadow-lg z-50 min-w-[200px]"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`p-2 rounded-lg transition-colors ${
                        soundEnabled ? 'bg-purple-600' : 'bg-gray-700'
                      }`}
                    >
                      {soundEnabled ? (
                        <Volume2 className="w-5 h-5" />
                      ) : (
                        <VolumeX className="w-5 h-5" />
                      )}
                    </button>
                    <span className="text-sm">
                      {soundEnabled ? 'Sound On' : 'Sound Off'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center text-sm mt-2">
                    Volume: {Math.round(volume * 100)}%
                  </div>
                </div>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
            >
              <option value="favorites">Sort by Favorites</option>
              <option value="name">Sort by Name</option>
              <option value="level">Sort by Level</option>
              <option value="rarity">Sort by Rarity</option>
            </select>

            <button
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <ArrowUpDown className={`w-5 h-5 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
            </button>

            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value as typeof rarityFilter)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
            >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
              <option value="mythic">Mythic</option>
            </select>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search characters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-400">Loading characters...</p>
          </div>
        ) : sortedAndFilteredCharacters.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {searchQuery
              ? 'No characters found matching your search'
              : 'No characters available'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAndFilteredCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onClick={() => navigate(`/characters/${character.id}`)}
                onToggleFavorite={handleToggleFavorite}
                soundEnabled={soundEnabled}
                volume={volume}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}