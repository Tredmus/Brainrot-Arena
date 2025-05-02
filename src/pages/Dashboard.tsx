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
  const [error, setError] = useState<string | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [hasStarterChest, setHasStarterChest] = useState(false);
  const [isClaimingStarter, setIsClaimingStarter] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const { data: existingPrefs, error: checkError } = await supabase
          .from('user_preferences')
          .select('sound_enabled, sort_by, volume')
          .eq('user_id', user.id)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existingPrefs) {
          setSoundEnabled(existingPrefs.sound_enabled);
          setSortBy(existingPrefs.sort_by as SortOption);
          setVolume(existingPrefs.volume || 1);
        } else {
          const { error: insertError } = await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              sound_enabled: true,
              sort_by: 'favorites',
              volume: 1
            });

          if (insertError) throw insertError;
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('starter_chest_claimed')
          .eq('id', user.id)
          .single();

        if (userError) throw userError;

        setHasStarterChest(!userData.starter_chest_claimed);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load user data');
      }
    }

    loadData();
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
            sort_by: sortBy,
            volume: volume
          });

        if (error) throw error;
      } catch (err) {
        console.error('Error saving preferences:', err);
        setError('Failed to save preferences');
      }
    }

    savePreferences();
  }, [user, soundEnabled, sortBy, volume]);

  const loadCharacters = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
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
            base_health,
            base_strength,
            base_intellect,
            base_defence,
            rarity,
            description,
            sound_effect
          )
        `)
        .eq('user_id', user.id);

      if (charactersError) throw charactersError;

      if (!userCharacters) {
        setCharacters([]);
        return;
      }

      const formattedCharacters: Character[] = userCharacters
        .filter(uc => uc.characters)
        .map(uc => ({
          id: uc.characters.id,
          name: uc.characters.name,
          image: uc.characters.image,
          level: uc.level,
          experience: uc.experience || 0,
          description: uc.characters.description,
          isFavorite: uc.is_favorite,
          rarity: uc.characters.rarity,
          sound_effect: uc.characters.sound_effect,
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
            armor: null,
            amulet: null,
            weapon: null,
            boots: null,
            belt: null,
            gloves: null,
            helmet: null,
            cloak: null
          }
        }));

      setCharacters(formattedCharacters);
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCharacters();
  }, [user]);

  const handleToggleFavorite = async (id: string) => {
    if (!user) return;

    try {
      const character = characters.find(c => c.id === id);
      if (!character) return;

      const { error: upsertError } = await supabase
        .from('user_characters')
        .update({ is_favorite: !character.isFavorite })
        .eq('user_id', user.id)
        .eq('character_id', id);

      if (upsertError) throw upsertError;

      setCharacters(prev => 
        prev.map(char => 
          char.id === id ? { ...char, isFavorite: !char.isFavorite } : char
        )
      );
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update favorite status');
    }
  };

  const handleClaimStarterChest = async () => {
    if (!user || isClaimingStarter) return;

    try {
      setIsClaimingStarter(true);

      const { data: rewards, error: rewardsError } = await supabase
        .rpc('handle_starter_chest');

      if (rewardsError) throw rewardsError;

      const { error: updateError } = await supabase
        .from('users')
        .update({ starter_chest_claimed: true })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const { error: charactersError } = await supabase
        .from('user_characters')
        .insert(
          rewards.map(reward => ({
            user_id: user.id,
            character_id: reward.id,
            level: 1,
            experience: 0,
            is_favorite: false
          }))
        );

      if (charactersError) throw charactersError;

      setHasStarterChest(false);
      
      await loadCharacters();
    } catch (err) {
      console.error('Error claiming starter chest:', err);
      setError('Failed to claim starter chest');
    } finally {
      setIsClaimingStarter(false);
    }
  };

  const getSortedCharacters = () => {
    return [...characters].sort((a, b) => {
      if (sortBy === 'favorites') {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return 0;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'level') {
        return b.level - a.level;
      }
      if (sortBy === 'rarity') {
        const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };
        return rarityOrder[b.rarity] - rarityOrder[a.rarity];
      }
      return 0;
    });
  };

  if (isLoadingUser) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (userError || !user) {
    return (
      <Layout>
        <div className="text-center text-red-400">
          {userError || 'Failed to load user data'}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-12">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Welcome, {user.username}!</h1>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 rounded-xl shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80&w=242')] opacity-10 bg-cover bg-center mix-blend-overlay" />
          <div className="relative p-8">
            <div className="flex items-start gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 text-transparent bg-clip-text">
                    Coming Soon
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <h3 className="font-bold text-yellow-400">Leagues</h3>
                    </div>
                    <p className="text-sm text-gray-300">
                      Compete in ranked leagues, earn exclusive rewards, and climb the global leaderboards!
                    </p>
                  </div>
                  <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      <h3 className="font-bold text-blue-400">Guilds</h3>
                    </div>
                    <p className="text-sm text-gray-300">
                      Join forces with other players, participate in guild wars, and share resources!
                    </p>
                  </div>
                  <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <h3 className="font-bold text-purple-400">And More!</h3>
                    </div>
                    <p className="text-sm text-gray-300">
                      Special events, unique characters, and exciting new game modes coming soon!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {hasStarterChest && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <Gift className="w-12 h-12 text-yellow-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Welcome Gift!</h3>
                <p className="text-gray-200 mb-4">
                  Claim your starter chest to receive 3 characters:
                  <br />
                  • 2 Common characters
                  <br />
                  • 1 Special character (65% chance for Rare, 35% chance for Epic)
                </p>
                <button
                  onClick={handleClaimStarterChest}
                  disabled={isClaimingStarter}
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isClaimingStarter ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5" />
                      Claim Starter Chest
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/store')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-lg shadow-lg hover:shadow-purple-500/20 transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <Package className="h-8 w-8" />
              <div className="text-left">
                <h3 className="text-lg font-bold">Store</h3>
                <p className="text-gray-300">Buy chests and characters!</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/arena')}
            className="bg-gradient-to-r from-red-600 to-orange-600 p-6 rounded-lg shadow-lg hover:shadow-red-500/20 transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <Swords className="h-8 w-8" />
              <div className="text-left">
                <h3 className="text-lg font-bold">Enter Arena</h3>
                <p className="text-gray-300">Battle other players!</p>
              </div>
            </div>
          </button>
        </div>

        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold">Your Characters</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => {
                    if (!soundEnabled) {
                      setSoundEnabled(true);
                    }
                    setShowVolumeSlider(!showVolumeSlider);
                  }}
                  className={`
                    p-2 rounded-lg transition-colors
                    ${soundEnabled ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-700 hover:bg-gray-600'}
                  `}
                  title={soundEnabled ? 'Sound Settings' : 'Enable Sounds'}
                >
                  {soundEnabled ? (
                    volume > 0.5 ? <Volume2 className="w-5 h-5" /> : <Volume1 className="w-5 h-5" />
                  ) : (
                    <VolumeX className="w-5 h-5" />
                  )}
                </button>

                {showVolumeSlider && (
                  <div className="absolute top-full mt-2 -left-20 bg-gray-800 p-4 rounded-lg shadow-lg w-48 z-50">
                    <div className="flex items-center gap-4 mb-2">
                      <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </button>
                      <span className="text-sm font-medium">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <ArrowUpDown className="h-4 w-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="favorites">Favorites First</option>
                  <option value="name">Name</option>
                  <option value="level">Level</option>
                  <option value="rarity">Rarity</option>
                </select>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Loading characters...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">{error}</div>
          ) : characters.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No characters found. Visit the store to get your first character!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getSortedCharacters().map(character => (
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
      </div>
    </Layout>
  );
}