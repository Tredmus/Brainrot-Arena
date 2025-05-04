import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, X, AlertCircle, FastForward, Timer, Sparkles, CreditCard, Swords, Trophy, Skull, Heart, Shield, Brain, Zap, Play, Battery } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useUser } from '../hooks/useUser';
import { BattleCharacter, BattleLog, BattleState } from '../types';
import { calculateDamage, createBattleLog, initializeBattleCharacter, determineNextTurn, checkBattleEnd, applySkillEffect } from '../utils/battleUtils';
import { canUseSkill, getCharacterSkill } from '../utils/skillUtils';

const rarityColors = {
  common: {
    border: 'ring-gray-400',
    text: 'text-gray-400',
    bg: 'bg-gray-400/10'
  },
  rare: {
    border: 'ring-blue-400',
    text: 'text-blue-400',
    bg: 'bg-blue-400/10'
  },
  epic: {
    border: 'ring-purple-400',
    text: 'text-purple-400',
    bg: 'bg-purple-400/10'
  },
  legendary: {
    border: 'ring-yellow-400',
    text: 'text-yellow-400',
    bg: 'bg-yellow-400/10'
  },
  mythic: {
    border: 'ring-red-400',
    text: 'text-red-400',
    bg: 'bg-red-400/10'
  }
};

function CharacterBattleCard({ character, isCurrentTurn }: { 
  character: BattleCharacter; 
  isCurrentTurn: boolean;
}) {
  const skill = character.skill;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rarityStyle = rarityColors[character.rarity];

  useEffect(() => {
    if (isCurrentTurn && character.sound_effect && audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play();
    }
  }, [isCurrentTurn, character.sound_effect]);

  useEffect(() => {
    if (isCurrentTurn && cardRef.current) {
      cardRef.current.classList.add('animate-shake');
      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.classList.remove('animate-shake');
        }
      }, 500);
    }
  }, [isCurrentTurn]);

  return (
    <div
      ref={cardRef}
      className={`
        relative bg-gray-900 rounded-lg overflow-hidden transition-all
        ${character.isDefeated ? 'opacity-50' : ''}
        ${isCurrentTurn ? `ring-2 ${rarityStyle.border} animate-pulse` : ''}
      `}
    >
      {character.sound_effect && (
        <audio
          ref={audioRef}
          src={character.sound_effect}
          preload="auto"
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-2 flex items-center justify-between">
        <h3 className="font-bold truncate text-sm">{character.name}</h3>
        <div className="text-xs font-semibold">Lv.{character.level}</div>
      </div>

      {/* Character Image */}
      <div className="relative w-full aspect-square">
        <img
          src={character.image}
          alt={character.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* Stats */}
      <div className="p-2 space-y-2">
        {/* Health Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-red-400" />
              <span>HP</span>
            </div>
            <span>{character.currentHp}/{character.maxHp}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
              style={{ width: `${(character.currentHp / character.maxHp) * 100}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-1 text-xs">
          <div className="bg-gray-800 rounded p-1">
            <div className="flex items-center gap-1">
              <Swords className="w-3 h-3 text-red-400" />
              <span className="text-red-400">ATK</span>
            </div>
            <div className="mt-0.5 font-bold">{character.stats.strength}</div>
          </div>
          <div className="bg-gray-800 rounded p-1">
            <div className="flex items-center gap-1">
              <Brain className="w-3 h-3 text-blue-400" />
              <span className="text-blue-400">INT</span>
            </div>
            <div className="mt-0.5 font-bold">{character.stats.intellect}</div>
          </div>
          <div className="bg-gray-800 rounded p-1">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-yellow-400" />
              <span className="text-yellow-400">DEF</span>
            </div>
            <div className="mt-0.5 font-bold">{character.stats.defence}</div>
          </div>
        </div>

        {/* Skill */}
        {skill && (
          <div className={`${rarityStyle.bg} rounded p-1.5`}>
            <div className="flex items-center gap-1 mb-0.5">
              <Zap className={`w-3 h-3 ${rarityStyle.text}`} />
              <span className={`text-xs font-bold ${rarityStyle.text} truncate`}>{skill.name}</span>
              {skill.currentCooldown > 0 && (
                <span className="ml-auto text-[10px] bg-gray-700 px-1 py-0.5 rounded">
                  CD: {skill.currentCooldown}
                </span>
              )}
            </div>
            <p className={`text-[10px] ${rarityStyle.text} line-clamp-2`}>{skill.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Battle() {
  const navigate = useNavigate();
  const { opponentId } = useParams();
  const { user, setLocalUserData } = useUser();
  const [currentRound, setCurrentRound] = useState(1);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [goldReward, setGoldReward] = useState(0);
  const [brainReward, setBrainReward] = useState(0);
  const [battleState, setBattleState] = useState<BattleState>({
    playerTeam: [],
    enemyTeam: [],
    currentTurn: 0,
    logs: [],
    isFinished: false,
    winner: null
  });

  useEffect(() => {
    if (battleState.isFinished) {
      const reward = calculateGoldReward(battleState.winner === 'player');
      const brains = calculateBrainReward(battleState.winner === 'player');
      setGoldReward(reward);
      setBrainReward(brains);
      setShowEndModal(true);
    }
  }, [battleState.isFinished]);

  const calculateGoldReward = (isWinner: boolean): number => {
    if (!isWinner) return 5; // Loser always gets 5 coins

    const random = Math.random() * 100;
    if (random <= 5) return 30;  // 5% chance for 30 coins
    if (random <= 20) return 20; // 15% chance for 20 coins
    if (random <= 50) return 15; // 30% chance for 15 coins
    return 10; // 50% chance for 10 coins
  };

  const calculateBrainReward = (isWinner: boolean): number => {
    if (!isWinner) return 0; // No brains for losing

    const random = Math.random() * 100;
    if (random <= 5) return 10;  // 5% chance for 10 brains
    if (random <= 20) return 5;  // 15% chance for 5 brains
    return 0; // 80% chance for 0 brains
  };

  const handlePrizeDelivery = async () => {
    if (!user || !opponentId) return;

    try {
      // Get opponent's glory
      const { data: opponent, error: opponentError } = await supabase
        .from('users')
        .select('glory')
        .eq('id', opponentId)
        .single();

      if (opponentError) throw opponentError;

      // Calculate glory difference
      const gloryDiff = user.glory - opponent.glory;
      
      // Only award glory if opponent has enough glory (no more than 200 less)
      const shouldAwardGlory = gloryDiff <= 200;
      const gloryChange =
      battleState.winner === 'player'
      ? (shouldAwardGlory ? 10 : 0)   // you win → 10 if worthy else 0
      : -5;  

      // Update user's rewards
      const { error: rewardsError } = await supabase
        .rpc('update_user_battle_rewards', {
          p_user_id: user.id,
          p_gold_earned: goldReward,
          p_glory_change: gloryChange,
          p_brains_earned: brainReward
        });

      if (rewardsError) throw rewardsError;

      // Update local user data
      setLocalUserData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          gold: prev.gold + goldReward,
          glory: prev.glory + gloryChange,
          rotten_brains: prev.rotten_brains + brainReward
        };
      });

      // Create battle log
      const { error: logError } = await supabase
        .from('battle_logs')
        .insert({
          user_id: user.id,
          winner_team: battleState.winner,
          player_characters: battleState.playerTeam,
          enemy_characters: battleState.enemyTeam,
          experience_gained: 10,
          gold_earned: goldReward
        });

      if (logError) throw logError;

      navigate('/arena');
    } catch (err) {
      console.error('Error delivering battle rewards:', err);
      setError('Failed to deliver battle rewards');
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initializeBattle() {
      if (!user || !opponentId) return;

      try {
        setIsLoading(true);
        
        // First try to deduct energy
        const { data: energyDeducted, error: energyError } = await supabase
          .rpc('deduct_battle_energy');

        if (energyError) throw energyError;
        if (!energyDeducted) {
          setShowEnergyModal(true);
          return;
        }

        // Store last energy update time
        localStorage.setItem('lastEnergyUpdate', Date.now().toString());

        const { data: playerTeam, error: playerError } = await supabase
          .from('battle_teams')
          .select(`
            character1_id,
            character2_id,
            character3_id
          `)
          .eq('user_id', user.id)
          .single();

        if (playerError) throw playerError;

        const { data: opponentTeam, error: opponentError } = await supabase
          .from('battle_teams')
          .select(`
            character1_id,
            character2_id,
            character3_id
          `)
          .eq('user_id', opponentId)
          .single();

        if (opponentError) throw opponentError;

        const { data: playerChars, error: playerCharsError } = await supabase
          .from('user_characters')
          .select(`
            id,
            level,
            experience,
            health,
            strength,
            intellect,
            defence,
            character_id,
            characters (
              id,
              name,
              image,
              description,
              rarity,
              skill_id
            )
          `)
          .in('character_id', [playerTeam.character1_id, playerTeam.character2_id, playerTeam.character3_id])
          .eq('user_id', user.id);

        if (playerCharsError) throw playerCharsError;

        const { data: opponentChars, error: opponentCharsError } = await supabase
          .from('user_characters')
          .select(`
            id,
            level,
            experience,
            health,
            strength,
            intellect,
            defence,
            character_id,
            characters (
              id,
              name,
              image,
              description,
              rarity,
              skill_id
            )
          `)
          .in('character_id', [opponentTeam.character1_id, opponentTeam.character2_id, opponentTeam.character3_id])
          .eq('user_id', opponentId);

        if (opponentCharsError) throw opponentCharsError;

        const sortedPlayerChars = [
          playerChars.find(c => c.character_id === playerTeam.character1_id),
          playerChars.find(c => c.character_id === playerTeam.character2_id),
          playerChars.find(c => c.character_id === playerTeam.character3_id)
        ].filter(Boolean);

        const sortedOpponentChars = [
          opponentChars.find(c => c.character_id === opponentTeam.character1_id),
          opponentChars.find(c => c.character_id === opponentTeam.character2_id),
          opponentChars.find(c => c.character_id === opponentTeam.character3_id)
        ].filter(Boolean);

        const playerBattleTeam = sortedPlayerChars.map((char, index) => initializeBattleCharacter({
          id: `player_${char.characters.id}_${index}`, // Make each instance unique
          name: char.characters.name,
          image: char.characters.image,
          level: char.level,
          description: char.characters.description,
          rarity: char.characters.rarity,
          stats: {
            health: char.health,
            strength: char.strength,
            intellect: char.intellect,
            defence: char.defence
          }
        }, 'player'));

        const enemyBattleTeam = sortedOpponentChars.map((char, index) => initializeBattleCharacter({
          id: `enemy_${char.characters.id}_${index}`, // Make each instance unique
          name: char.characters.name,
          image: char.characters.image,
          level: char.level,
          description: char.characters.description,
          rarity: char.characters.rarity,
          stats: {
            health: char.health,
            strength: char.strength,
            intellect: char.intellect,
            defence: char.defence
          }
        }, 'enemy'));

        if (mounted) {
          setBattleState({
            playerTeam: playerBattleTeam,
            enemyTeam: enemyBattleTeam,
            currentTurn: 0,
            logs: [createBattleLog('attack', 'Battle started!')],
            isFinished: false,
            winner: null
          });
        }
      } catch (err) {
        console.error('Error initializing battle:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize battle');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeBattle();

    return () => {
      mounted = false;
    };
  }, [user, opponentId, navigate]);

  const allCharacters = [...battleState.playerTeam, ...battleState.enemyTeam];
  const currentCharacter = allCharacters[battleState.currentTurn];

  const executeTurn = async () => {
    if (battleState.isFinished) return;

    const allCharacters = [...battleState.playerTeam, ...battleState.enemyTeam];
    const currentChar = allCharacters[battleState.currentTurn];
    
    if (!currentChar) {
      console.error('No character found for current turn');
      return;
    }
    
    if (currentChar.isDefeated) {
      const nextTurn = determineNextTurn(battleState);
      setBattleState(prev => ({ ...prev, currentTurn: nextTurn }));
      return;
    }

    const canUseSkillNow = currentChar.skill && canUseSkill(currentChar.skill);
    const useSkill = canUseSkillNow && Math.random() > 0.5;

    let newState = { ...battleState };
    let logs: BattleLog[] = [];

    if (useSkill) {
      const result = applySkillEffect(currentChar, battleState);
      newState = result.state;
      logs = result.logs;
    } else {
      const isPlayerTeam = battleState.playerTeam.includes(currentChar);
      const possibleTargets = isPlayerTeam ? battleState.enemyTeam : battleState.playerTeam;
      const aliveTargets = possibleTargets.filter(c => !c.isDefeated);
      
      if (aliveTargets.length > 0) {
        const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
        const { damage, isCrit, isMiss } = calculateDamage(currentChar, target);
        
        if (isMiss) {
          logs.push(createBattleLog('miss', `${currentChar.name}'s attack missed ${target.name}!`));
        } else {
          const updatedTarget = { ...target, currentHp: Math.max(0, target.currentHp - damage) };
          const isDefeated = updatedTarget.currentHp === 0;
          
          if (isDefeated) {
            updatedTarget.isDefeated = true;
            logs.push(createBattleLog('defeat', `${target.name} has been defeated!`));
          }
          
          logs.push(createBattleLog(
            isCrit ? 'crit' : 'damage',
            `${currentChar.name} deals ${damage}${isCrit ? ' critical' : ''} damage to ${target.name}!`
          ));
          
          newState = {
            ...battleState,
            playerTeam: battleState.playerTeam.map(c => c.id === target.id ? updatedTarget : c),
            enemyTeam: battleState.enemyTeam.map(c => c.id === target.id ? updatedTarget : c),
          };
        }
      }
    }

    // Update skill cooldowns
    newState = {
      ...newState,
      playerTeam: newState.playerTeam.map(c => ({
        ...c,
        skill: c.skill ? { ...c.skill, currentCooldown: Math.max(0, c.skill.currentCooldown - 1) } : null
      })),
      enemyTeam: newState.enemyTeam.map(c => ({
        ...c,
        skill: c.skill ? { ...c.skill, currentCooldown: Math.max(0, c.skill.currentCooldown - 1) } : null
      }))
    };

    const battleEnd = checkBattleEnd(newState);
    if (battleEnd.isFinished) {
      newState = {
        ...newState,
        isFinished: true,
        winner: battleEnd.winner
      };
      logs.push(createBattleLog(
        battleEnd.winner === 'player' ? 'victory' : 'defeat',
        `Battle ended! ${battleEnd.winner === 'player' ? 'Victory!' : 'Defeat!'}`
      ));
    }

    const nextTurn = determineNextTurn(newState);
    
    setBattleState({
      ...newState,
      currentTurn: nextTurn,
      logs: [...newState.logs, ...logs]
    });

    if (nextTurn === 0) {
      setCurrentRound(prev => prev + 1);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-red-500/10 text-red-400 p-4 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => navigate('/arena')}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Return to Arena
          </button>
        </div>
      </Layout>
    );
  }

  if (showEnergyModal) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <Battery className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Not Enough Energy</h2>
            <p className="text-gray-400 mb-6">
              You don't have enough energy to start a battle. Energy replenishes over time or can be restored using items.
            </p>
            <button
              onClick={() => navigate('/arena')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-semibold"
            >
              Return to Arena
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/arena')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Swords className="w-6 h-6 text-red-400" />
              Battle - Round {currentRound}
            </h1>
          </div>

          {!battleState.isFinished && (
            <button
              onClick={executeTurn}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Next Turn
            </button>
          )}
        </div>

        {/* Battle Arena */}
        <div className="relative bg-gray-800 rounded-lg p-8">
          {/* Enemy Team */}
          <div className="grid grid-cols-3 gap-6 mb-12">
            {battleState.enemyTeam.map((character) => (
              <CharacterBattleCard
                key={character.id}
                character={character}
                isCurrentTurn={currentCharacter?.id === character.id}
              />
            ))}
          </div>

          {/* VS Divider */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center text-2xl font-bold shadow-lg">
              VS
            </div>
          </div>

          {/* Player Team */}
          <div className="grid grid-cols-3 gap-6">
            {battleState.playerTeam.map((character) => (
              <CharacterBattleCard
                key={character.id}
                character={character}
                isCurrentTurn={currentCharacter?.id === character.id}
              />
            ))}
          </div>
        </div>

        {/* Battle Log */}
        <div className="bg-gray-800 rounded-lg p-4 h-48 overflow-y-auto">
          <div className="space-y-2">
            {battleState.logs.map((log, index) => (
              <div
                key={log.id}
                className={`
                  p-2 rounded
                  ${log.type === 'crit' ? 'bg-yellow-500/10 text-yellow-400' :
                    log.type === 'miss' ? 'bg-gray-500/10 text-gray-400' :
                    log.type === 'defeat' ? 'bg-red-500/10 text-red-400' :
                    log.type === 'victory' ? 'bg-green-500/10 text-green-400' :
                    'bg-gray-900 text-white'}
                `}
              >
                {log.message}
              </div>
            ))}
          </div>
        </div>

        {/* Victory/Defeat Screen */}
        {battleState.isFinished && showEndModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
              <div className="text-6xl mb-4">
                {battleState.winner === 'player' ? (
                  <Trophy className="w-24 h-24 text-yellow-400 mx-auto" />
                ) : (
                  <Skull className="w-24 h-24 text-red-400 mx-auto" />
                )}
              </div>
              <h2 className="text-3xl font-bold mb-4">
                {battleState.winner === 'player' ? 'Victory!' : 'Defeat!'}
              </h2>
              <div className="space-y-2 mb-6">
                {battleState.winner === 'player' ? (
                  <>
                    <div className="text-lg">
                      Gold Earned: <span className="text-yellow-400">{goldReward}</span>
                    </div>
                    {brainReward > 0 && (
                      <div className="text-lg">
                        Brains Found: <span className="text-green-400">{brainReward}</span>
                      </div>
                    )}
                    <div className="text-lg">
                      Glory Gained: <span className="text-purple-400">10</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-lg">
                      Gold Earned: <span className="text-yellow-400">5</span>
                    </div>
                    <div className="text-lg">
                      Glory Lost: <span className="text-red-400">5</span>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={handlePrizeDelivery}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold transition-colors"
              >
                Claim Rewards
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}