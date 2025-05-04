import React, { useState, useEffect, useRef } from 'react';
import { Star, Swords, X, Zap } from 'lucide-react';
import { Character, BattleTeam } from '../types';
import { supabase } from '../lib/supabase';
import { getCharacterSkill } from '../utils/skillUtils';

interface CharacterCardProps {
  character: Character;
  onClick?: () => void;
  onToggleFavorite?: (id: string) => void;
  soundEnabled?: boolean;
  volume?: number;
}

const rarityColors = {
  common: {
    border: 'from-gray-400',
    bg: 'bg-gray-400/10',
    text: 'text-gray-400',
    glow: 'hover:shadow-gray-500/20',
    frame: 'from-gray-600 to-gray-400',
    cardBg: 'from-gray-900 to-gray-800'
  },
  rare: {
    border: 'from-blue-400',
    bg: 'bg-blue-400/10',
    text: 'text-blue-400',
    glow: 'hover:shadow-blue-500/20',
    frame: 'from-blue-600 to-blue-400',
    cardBg: 'from-blue-900 to-gray-900'
  },
  epic: {
    border: 'from-purple-400',
    bg: 'bg-purple-400/10',
    text: 'text-purple-400',
    glow: 'hover:shadow-purple-500/20',
    frame: 'from-purple-600 to-purple-400',
    cardBg: 'from-purple-900 to-gray-900'
  },
  legendary: {
    border: 'from-yellow-400',
    bg: 'bg-yellow-400/10',
    text: 'text-yellow-400',
    glow: 'hover:shadow-yellow-500/20',
    frame: 'from-yellow-600 to-yellow-400',
    cardBg: 'from-yellow-900 to-gray-900'
  },
  mythic: {
    border: 'from-red-400',
    bg: 'bg-red-400/10',
    text: 'text-red-400',
    glow: 'hover:shadow-red-500/20',
    frame: 'from-red-600 to-red-400',
    cardBg: 'from-red-900 to-gray-900'
  }
};

const getNextLevelXP = (level: number): number => {
  switch (level) {
    case 1: return 10;  // Need 10 XP for level 2
    case 2: return 15;  // Need 15 XP for level 3
    case 3: return 30;  // Need 30 XP for level 4
    case 4: return 45;  // Need 45 XP for level 5
    default: return 0;  // Max level
  }
};

const defaultStats = {
  health: 0,
  strength: 0,
  intellect: 0,
  defence: 0
};

export default function CharacterCard({ 
  character, 
  onClick, 
  onToggleFavorite, 
  soundEnabled = true,
  volume = 1
}: CharacterCardProps) {
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [battleTeam, setBattleTeam] = useState<BattleTeam | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInTeam, setIsInTeam] = useState(false);
  const [teamPosition, setTeamPosition] = useState<number | null>(null);
  const [teamCharacters, setTeamCharacters] = useState<Character[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  const skill = getCharacterSkill(character.name);

  useEffect(() => {
    const checkTeamStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: teamData } = await supabase
          .from('battle_teams')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (teamData) {
          if (teamData.character1_id === character.id) {
            setIsInTeam(true);
            setTeamPosition(1);
          } else if (teamData.character2_id === character.id) {
            setIsInTeam(true);
            setTeamPosition(2);
          } else if (teamData.character3_id === character.id) {
            setIsInTeam(true);
            setTeamPosition(3);
          } else {
            setIsInTeam(false);
            setTeamPosition(null);
          }
          setBattleTeam(teamData);

          const { data: characters } = await supabase
            .from('characters')
            .select('*')
            .in('id', [teamData.character1_id, teamData.character2_id, teamData.character3_id]);

          if (characters) {
            const sortedCharacters = [
              characters.find(c => c.id === teamData.character1_id),
              characters.find(c => c.id === teamData.character2_id),
              characters.find(c => c.id === teamData.character3_id)
            ].filter(Boolean) as Character[];

            setTeamCharacters(sortedCharacters);
          }
        }
      } catch (err) {
        console.error('Error checking team status:', err);
      }
    };

    checkTeamStatus();

    return () => {
      if (audioRef.current && isPlayingRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        isPlayingRef.current = false;
      }
    };
  }, [character.id]);

  const handleMouseEnter = () => {
    if (!soundEnabled || !character.sound_effect || !audioRef.current || isPlayingRef.current) return;

    try {
      audioRef.current.volume = volume;
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        isPlayingRef.current = true;
        playPromise.catch(err => {
          console.error('Error playing sound:', err);
          isPlayingRef.current = false;
        });
      }
    } catch (err) {
      console.error('Error playing sound:', err);
      isPlayingRef.current = false;
    }
  };

  const handleMouseLeave = () => {
    if (!audioRef.current || !isPlayingRef.current) return;

    try {
      const pausePromise = audioRef.current.pause();
      if (pausePromise !== undefined) {
        Promise.resolve(pausePromise).then(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
          }
          isPlayingRef.current = false;
        });
      }
    } catch (err) {
      console.error('Error pausing sound:', err);
      isPlayingRef.current = false;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    onClick?.();
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(character.id);
  };

  const handleTeamClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: teamData, error: teamError } = await supabase
        .from('battle_teams')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (teamError && teamError.code !== 'PGRST116') {
        throw teamError;
      }

      setBattleTeam(teamData);
      setShowTeamModal(true);
    } catch (err) {
      console.error('Error checking battle team:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapPosition = async (newPosition: 1 | 2 | 3) => {
    if (!battleTeam || !teamPosition) return;

    setIsLoading(true);
    try {
      const update: Partial<BattleTeam> = {};
      const currentCharId = character.id;
      let otherCharId: string | null = null;

      switch (newPosition) {
        case 1:
          otherCharId = battleTeam.character1_id;
          break;
        case 2:
          otherCharId = battleTeam.character2_id;
          break;
        case 3:
          otherCharId = battleTeam.character3_id;
          break;
      }

      switch (teamPosition) {
        case 1:
          update.character1_id = otherCharId;
          break;
        case 2:
          update.character2_id = otherCharId;
          break;
        case 3:
          update.character3_id = otherCharId;
          break;
      }

      switch (newPosition) {
        case 1:
          update.character1_id = currentCharId;
          break;
        case 2:
          update.character2_id = currentCharId;
          break;
        case 3:
          update.character3_id = currentCharId;
          break;
      }

      const { error } = await supabase
        .from('battle_teams')
        .update(update)
        .eq('id', battleTeam.id);

      if (error) throw error;

      setShowTeamModal(false);
      setTeamPosition(newPosition);
    } catch (err) {
      console.error('Error swapping team positions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplaceCharacter = async (position: 1 | 2 | 3) => {
    if (!battleTeam) return;

    setIsLoading(true);
    try {
      const update: Partial<BattleTeam> = {};
      
      switch (position) {
        case 1:
          update.character1_id = character.id;
          break;
        case 2:
          update.character2_id = character.id;
          break;
        case 3:
          update.character3_id = character.id;
          break;
      }

      const { error } = await supabase
        .from('battle_teams')
        .update(update)
        .eq('id', battleTeam.id);

      if (error) throw error;

      setShowTeamModal(false);
      setIsInTeam(true);
      setTeamPosition(position);
    } catch (err) {
      console.error('Error updating battle team:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const rarity = character.rarity || 'common';
  const rarityStyle = rarityColors[rarity];

  const nextLevelXP = getNextLevelXP(character.level);
  const xpProgress = nextLevelXP > 0 ? (character.experience / nextLevelXP) * 100 : 100;

  const stats = character.stats || defaultStats;
  const baseStats = character.baseStats || defaultStats;

  return (
    <>
      <div 
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          relative w-full aspect-[2/3] cursor-pointer transform transition-all duration-300
          hover:scale-105 group mb-8
        `}
      >
        {character.sound_effect && (
          <audio
            ref={audioRef}
            src={character.sound_effect}
            preload="auto"
          />
        )}

        <div className={`
          absolute inset-0 rounded-2xl
          bg-gradient-to-br ${rarityStyle.frame}
          p-[3px]
          before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent
          after:absolute after:inset-0 after:bg-gradient-to-br after:from-black/40 after:to-transparent
        `}>
          <div className={`
            relative h-full rounded-xl
            bg-gradient-to-b ${rarityStyle.cardBg}
          `}>
            <div className={`
              relative h-12 bg-gradient-to-r ${rarityStyle.border} to-transparent
              flex items-center px-4 gap-2
            `}>
              <h3 className="font-bold text-white truncate flex-1">{character.name}</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-24 h-2 bg-gray-900/90 rounded-full overflow-hidden border border-gray-700">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {character.level >= 5 ? 'MAX' : `${character.experience}/${nextLevelXP} XP`}
                  </div>
                </div>
                <div className="text-sm font-semibold">Lv.{character.level}</div>
              </div>
            </div>

            <div className="relative h-[40%] overflow-hidden">
              <img 
                src={character.image} 
                alt={character.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>

            <div className="p-3">
              <div className="grid grid-cols-2 gap-2">
                <div className={`flex flex-col ${rarityStyle.bg} rounded-lg p-2`}>
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 font-bold">ATK</span>
                    <span className="text-white font-bold">{stats.strength}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Base: {baseStats.strength}
                  </div>
                </div>
                <div className={`flex flex-col ${rarityStyle.bg} rounded-lg p-2`}>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 font-bold">INT</span>
                    <span className="text-white font-bold">{stats.intellect}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Base: {baseStats.intellect}
                  </div>
                </div>
                <div className={`flex flex-col ${rarityStyle.bg} rounded-lg p-2`}>
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-400 font-bold">DEF</span>
                    <span className="text-white font-bold">{stats.defence}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Base: {baseStats.defence}
                  </div>
                </div>
                <div className={`flex flex-col ${rarityStyle.bg} rounded-lg p-2`}>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400 font-bold">HP</span>
                    <span className="text-white font-bold">{stats.health}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Base: {baseStats.health}
                  </div>
                </div>
              </div>

              {skill && (
                <div className="mt-2 p-2 bg-black/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className={`w-4 h-4 ${rarityStyle.text}`} />
                    <span className={`text-sm font-bold ${rarityStyle.text}`}>{skill.name}</span>
                  </div>
                  <p className="text-xs text-gray-300">{skill.description}</p>
                </div>
              )}

              {!skill && (
                <div className="mt-3 p-2 bg-black/30 rounded-lg">
                  <p className="text-sm text-gray-300 line-clamp-3">
                    {character.description || 'A mysterious warrior with untold powers.'}
                  </p>
                </div>
              )}
            </div>

            <div className={`
              absolute top-14 right-0 px-3 py-1
              bg-gradient-to-l ${rarityStyle.border} to-transparent
              text-xs font-bold text-white uppercase tracking-wider
            `}>
              {rarity}
            </div>
          </div>
        </div>

        <button
          onClick={handleTeamClick}
          disabled={isLoading}
          className={`
            absolute -top-6 left-1/2 -translate-x-1/2
            w-12 h-12 rounded-full
            bg-gradient-to-br ${rarityStyle.frame} p-[3px]
            hover:scale-110 transition-transform z-10
            before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent before:rounded-full
            after:absolute after:inset-0 after:bg-gradient-to-br after:from-black/40 after:to-transparent after:rounded-full
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <div className="relative w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
            <Swords className={`h-6 w-6 ${isInTeam ? 'text-red-400' : 'text-gray-400'}`} />
            {teamPosition && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                {teamPosition}
              </div>
            )}
          </div>
        </button>

        <button
          onClick={handleFavoriteClick}
          className={`
            absolute -bottom-6 left-1/2 -translate-x-1/2
            w-12 h-12 rounded-full
            bg-gradient-to-br ${rarityStyle.frame} p-[3px]
            hover:scale-110 transition-transform z-10
            before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent before:rounded-full
            after:absolute after:inset-0 after:bg-gradient-to-br after:from-black/40 after:to-transparent after:rounded-full
          `}
        >
          <div className="relative w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
            <Star
              className={`h-6 w-6 transition-colors ${
                character.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'
              }`}
            />
          </div>
        </button>
      </div>

      {showTeamModal && battleTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/90" onClick={() => setShowTeamModal(false)} />
          <div className="relative bg-gray-900 rounded-xl shadow-xl w-full max-w-4xl mx-4 animate-[bounceIn_0.5s_ease-out]">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold">
                {isInTeam ? 'Switch Position With' : 'Select Position to Replace'}
              </h2>
              <button
                onClick={() => setShowTeamModal(false)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-purple-400">Selected Character</h3>
                <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-4">
                  <img
                    src={character.image}
                    alt={character.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <div className="font-bold text-lg">{character.name}</div>
                    <div className="text-sm text-gray-400">Level {character.level}</div>
                  </div>
                  {isInTeam && (
                    <div className="ml-auto px-3 py-1 bg-red-500 rounded-full text-sm font-bold">
                      Position {teamPosition}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-purple-400">Current Team</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {teamCharacters.map((teamChar, index) => (
                    <button
                      key={teamChar.id}
                      onClick={() => isInTeam ? handleSwapPosition((index + 1) as 1 | 2 | 3) : handleReplaceCharacter((index + 1) as 1 | 2 | 3)}
                      disabled={isLoading || teamChar.id === character.id}
                      className={`
                        bg-gray-800 rounded-lg p-4 text-left
                        transition-all relative
                        ${teamChar.id === character.id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700 hover:scale-105'}
                      `}
                    >
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-lg font-bold">
                        {index + 1}
                      </div>
                      <img
                        src={teamChar.image}
                        alt={teamChar.name}
                        className="w-full aspect-square rounded-lg object-cover mb-4"
                      />
                      <div className="font-bold truncate">{teamChar.name}</div>
                      <div className="text-sm text-gray-400">Level {teamChar.level}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}