import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, X, AlertCircle, FastForward, Timer, Sparkles, CreditCard } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useUser } from '../hooks/useUser';

interface Prize {
  id: string;
  name: string;
  type: 'character' | 'item' | 'brains';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  image: string;
  description: string;
  value: number;
}

const chestConfigs = {
  bronze: {
    cost: 100,
    minPrizes: 1,
    maxPrizes: 1,
    prizes: [
      { type: 'brains', weight: 15, min: 5, max: 15 },
      { type: 'character', weight: 70, rarities: ['common'] },
      { type: 'item', weight: 15, rarities: ['common'] }
    ]
  },
  silver: {
    cost: 250,
    minPrizes: 1,
    maxPrizes: 2,
    prizes: [
      { type: 'brains', weight: 20, min: 10, max: 30 },
      { type: 'character', weight: 60, rarities: ['common', 'rare'] },
      { type: 'item', weight: 20, rarities: ['common', 'rare'] }
    ]
  },
  gold: {
    cost: 500,
    minPrizes: 2,
    maxPrizes: 3,
    prizes: [
      { type: 'brains', weight: 25, min: 25, max: 75 },
      { type: 'character', weight: 55, rarities: ['rare', 'epic'] },
      { type: 'item', weight: 20, rarities: ['rare', 'epic'] }
    ]
  },
  ruby: {
    cost: 1000,
    minPrizes: 3,
    maxPrizes: 4,
    prizes: [
      { type: 'brains', weight: 30, min: 50, max: 150 },
      { type: 'character', weight: 50, rarities: ['epic', 'legendary'] },
      { type: 'item', weight: 20, rarities: ['epic', 'legendary'] }
    ]
  },
  diamond: {
    cost: 2500,
    minPrizes: 4,
    maxPrizes: 7,
    prizes: [
      { type: 'brains', weight: 35, min: 100, max: 300 },
      { type: 'character', weight: 45, rarities: ['legendary', 'mythic'] },
      { type: 'item', weight: 20, rarities: ['legendary', 'mythic'] }
    ]
  },
  tralalero: {
    cost: 100,
    minPrizes: 1,
    maxPrizes: 1,
    prizes: [
      { type: 'character', weight: 100, rarities: ['epic'] }
    ]
  }
};

const rarityColors = {
  common: 'border-gray-400 bg-gray-400/10',
  rare: 'border-blue-400 bg-blue-400/10',
  epic: 'border-purple-400 bg-purple-400/10',
  legendary: 'border-yellow-400 bg-yellow-400/10',
  mythic: 'border-red-400 bg-red-400/10'
};

const PrizeCard = ({ prize, isSelected, isSpinning }: { 
  prize: Prize; 
  isSelected: boolean;
  isSpinning: boolean;
}) => (
  <div 
    className={`
      relative aspect-square border-2 rounded-lg overflow-hidden transition-all duration-200
      ${rarityColors[prize.rarity]}
      ${isSelected ? 'scale-105 ring-4 ring-white/50' : ''}
      ${isSpinning ? 'opacity-50' : ''}
    `}
  >
    <img 
      src={isSelected ? prize.image : "https://snipboard.io/DXfAEd.jpg"}
      alt={isSelected ? prize.name : "Hidden Prize"}
      className="w-full h-full object-cover"
    />
    {isSelected && (
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
        <div className="text-xs font-semibold truncate">{prize.name}</div>
        <div className="text-xs text-gray-300 truncate">{prize.description}</div>
      </div>
    )}
  </div>
);

const PrizeModal = ({ prize, onClose, onClaim }: { 
  prize: Prize; 
  onClose: () => void;
  onClaim: () => void;
}) => (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
    <div className={`
      relative max-w-md w-full bg-gray-900 rounded-xl overflow-hidden
      ${rarityColors[prize.rarity]}
      animate-[bounceIn_0.5s_ease-out]
    `}>
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 p-2 rounded-full hover:bg-black/20"
      >
        <X className="w-6 h-6" />
      </button>
      
      <div className="p-6 text-center">
        <img 
          src={prize.image} 
          alt={prize.name}
          className="w-48 h-48 object-cover rounded-lg mx-auto mb-4"
        />
        <h3 className="text-2xl font-bold mb-2">{prize.name}</h3>
        <p className="text-gray-400 mb-4">{prize.description}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onClaim}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Claim Prize
          </button>
        </div>
      </div>
    </div>
  </div>
);

const PrizeList = ({ prizes }: { prizes: Prize[] }) => {
  const navigate = useNavigate();
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-8 max-w-4xl w-full">
        <h2 className="text-2xl font-bold mb-6">Your Rewards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {prizes.map((prize, index) => (
            <div 
              key={index}
              className={`
                bg-gray-800 rounded-lg p-4 border-2
                ${rarityColors[prize.rarity]}
              `}
            >
              <img
                src={prize.image}
                alt={prize.name}
                className="w-full aspect-square object-cover rounded-lg mb-4"
              />
              <div className="space-y-2">
                <h3 className="font-bold text-lg">{prize.name}</h3>
                <p className="text-sm text-gray-400">{prize.description}</p>
                <div className="text-sm font-semibold capitalize text-gray-300">
                  {prize.rarity}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate('/store')}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
          >
            Return to Store
          </button>
        </div>
      </div>
    </div>
  );
};

export default function OpenChest() {
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();
  const { user } = useUser();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [finalPrize, setFinalPrize] = useState<Prize | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remainingPrizes, setRemainingPrizes] = useState<number>(0);
  const [collectedPrizes, setCollectedPrizes] = useState<Prize[]>([]);
  const [showPrizeList, setShowPrizeList] = useState(false);

  useEffect(() => {
    if (prizes.length > 0 && !isSpinning && selectedIndex === null) {
      startSpin();
    }
  }, [prizes]);

  useEffect(() => {
    if (!type || !chestConfigs[type as keyof typeof chestConfigs]) {
      navigate('/store');
      return;
    }

    async function loadPrizes() {
      try {
        const chestConfig = chestConfigs[type as keyof typeof chestConfigs];
        const availablePrizes: Prize[] = [];

        const characterPrize = chestConfig.prizes.find(p => p.type === 'character');
        if (characterPrize) {
          const { data: characters } = await supabase
            .from('characters')
            .select('*')
            .in('rarity', characterPrize.rarities);

          if (characters) {
            characters.forEach(char => {
              availablePrizes.push({
                id: char.id,
                name: char.name,
                type: 'character',
                rarity: char.rarity,
                image: char.image,
                description: char.description || `${char.rarity} Character`,
                value: 0
              });
            });
          }
        }

        const itemPrize = chestConfig.prizes.find(p => p.type === 'item');
        if (itemPrize) {
          const { data: items } = await supabase
            .from('items')
            .select('*')
            .in('rarity', itemPrize.rarities);

          if (items) {
            items.forEach(item => {
              availablePrizes.push({
                id: item.id,
                name: item.name,
                type: 'item',
                rarity: item.rarity,
                image: item.icon,
                description: item.description || `${item.rarity} Item`,
                value: 0
              });
            });
          }
        }

        const brainPrize = chestConfig.prizes.find(p => p.type === 'brains');
        if (brainPrize) {
          const amount = Math.floor(
            Math.random() * (brainPrize.max - brainPrize.min + 1) + 
            brainPrize.min
          );
          availablePrizes.push({
            id: 'brains',
            name: `${amount} Rotten Brains`,
            type: 'brains',
            rarity: 'common',
            image: 'https://images.unsplash.com/photo-1578252389465-6acb8a88fe9b?auto=format&fit=crop&q=80&w=300&h=300',
            description: `${amount} rotten brains`,
            value: amount
          });
        }

        // Determine number of prizes based on chest config
        let numPrizes = chestConfig.minPrizes;
        
        // Randomly increase prizes up to maxPrizes
        if (chestConfig.maxPrizes > chestConfig.minPrizes) {
          const extraPrizes = Math.floor(Math.random() * (chestConfig.maxPrizes - chestConfig.minPrizes + 1));
          numPrizes += extraPrizes;
        }

        // Select prizes
        const selectedPrizes = Array.from({ length: 9 }, () => {
          const totalWeight = chestConfig.prizes.reduce((sum, p) => sum + p.weight, 0);
          let random = Math.random() * totalWeight;
          
          for (const prize of chestConfig.prizes) {
            random -= prize.weight;
            if (random <= 0) {
              const prizePool = availablePrizes.filter(p => p.type === prize.type);
              return prizePool[Math.floor(Math.random() * prizePool.length)];
            }
          }
          
          return availablePrizes[Math.floor(Math.random() * availablePrizes.length)];
        });

        setPrizes(selectedPrizes);
        setRemainingPrizes(numPrizes - 1);
      } catch (err) {
        console.error('Error loading prizes:', err);
        setError('Failed to load prizes');
      }
    }

    loadPrizes();
  }, [type, navigate]);

  const handlePrizeDelivery = async (prize: Prize) => {
    if (!user) return;

    try {
      if (prize.type === 'brains') {
        const { error } = await supabase
          .from('users')
          .update({ rotten_brains: user.rotten_brains + prize.value })
          .eq('id', user.id);

        if (error) throw error;
      } else if (prize.type === 'character') {
        const { data: existingCharacter, error: queryError } = await supabase
          .from('user_characters')
          .select('id, level, experience')
          .match({ user_id: user.id, character_id: prize.id })
          .maybeSingle();

        if (queryError) throw queryError;

        if (existingCharacter) {
          const xpGain = 5;
          const { error: updateError } = await supabase
            .from('user_characters')
            .update({ experience: existingCharacter.experience + xpGain })
            .eq('id', existingCharacter.id);

          if (updateError) throw updateError;

          prize.description = `Duplicate character converted to ${xpGain} XP`;
        } else {
          const { error } = await supabase
            .from('user_characters')
            .insert({
              user_id: user.id,
              character_id: prize.id,
              level: 1,
              experience: 0,
              is_favorite: false
            });

          if (error) throw error;
        }
      } else if (prize.type === 'item') {
        const { error } = await supabase
          .from('user_items')
          .insert({
            user_id: user.id,
            item_id: prize.id,
            is_equipped: false
          });

        if (error) throw error;
      }

      setCollectedPrizes(prev => [...prev, prize]);

      if (remainingPrizes > 0) {
        setShowModal(false);
        setRemainingPrizes(prev => prev - 1);
        startSpin();
      } else {
        setShowPrizeList(true);
      }
    } catch (err) {
      console.error('Error delivering prize:', err);
      setError('Failed to deliver prize');
    }
  };

  const skipToEnd = async () => {
    if (!user || !type || !prizes.length || !isSpinning) return;

    try {
      const finalIndex = Math.floor(Math.random() * prizes.length);
      setSelectedIndex(finalIndex);
      setFinalPrize(prizes[finalIndex]);
      setIsSpinning(false);
      setTimeout(() => setShowModal(true), 500);
    } catch (err) {
      console.error('Error skipping:', err);
      setError('Failed to skip animation');
      setIsSpinning(false);
    }
  };

  const startSpin = () => {
    setIsSpinning(true);
    let duration = 0;
    let interval = 50;
    let currentIndex = 0;

    const spin = () => {
      setSelectedIndex(currentIndex);
      currentIndex = (currentIndex + 1) % prizes.length;
      duration += interval;

      if (duration < 2000) {
        setTimeout(spin, interval);
      } else if (duration < 3000) {
        setTimeout(spin, interval * 2);
      } else if (duration < 4000) {
        setTimeout(spin, interval * 3);
      } else {
        const finalIndex = Math.floor(Math.random() * prizes.length);
        setSelectedIndex(finalIndex);
        setFinalPrize(prizes[finalIndex]);
        setIsSpinning(false);
        setTimeout(() => setShowModal(true), 500);
      }
    };

    spin();
  };

  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/store')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Store
            </button>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 p-8 bg-gray-800 rounded-lg">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-xl text-red-400">{error}</p>
            <button
              onClick={() => navigate('/store')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Return to Store
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/store')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Store
          </button>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold capitalize">{type} Chest</h1>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-8">
          <div className="grid grid-cols-3 gap-4 mb-8">
            {prizes.map((prize, index) => (
              <PrizeCard
                key={index}
                prize={prize}
                isSelected={selectedIndex === index}
                isSpinning={isSpinning}
              />
            ))}
          </div>

          {isSpinning && (
            <div className="flex justify-center">
              <button
                onClick={skipToEnd}
                className="px-8 py-3 rounded-lg font-semibold text-lg bg-gray-700 hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <FastForward className="w-5 h-5" />
                Skip
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && finalPrize && (
        <PrizeModal
          prize={finalPrize}
          onClose={() => setShowModal(false)}
          onClaim={() => handlePrizeDelivery(finalPrize)}
        />
      )}

      {showPrizeList && (
        <PrizeList prizes={collectedPrizes} />
      )}
    </Layout>
  );
}