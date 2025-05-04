import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Swords, Search, Trophy, Users, AlertCircle, Brain, Coins, CreditCard, Loader2, Zap, Info } from 'lucide-react';
import Layout from '../components/Layout';
import PaymentModal from '../components/PaymentModal';
import { supabase } from '../lib/supabase';
import { useUser } from '../hooks/useUser';

interface ChestType {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  rewards: {
    min: number;
    max: number;
    chances: number[];
    rarities: ('common' | 'rare' | 'epic' | 'legendary' | 'mythic')[];
  };
}

const chests: ChestType[] = [
  {
    id: 'bronze',
    name: 'Bronze Chest',
    price: 100,
    image: 'https://i.snipboard.io/89TWyE.jpg',
    description: 'Common Characters and Items',
    rarity: 'common',
    rewards: {
      min: 1,
      max: 1,
      chances: [65, 25, 10],
      rarities: ['common', 'rare', 'epic']
    }
  },
  {
    id: 'silver',
    name: 'Silver Chest',
    price: 250,
    image: 'https://i.snipboard.io/7laeyw.jpg',
    description: 'Chance for Rare Characters',
    rarity: 'rare',
    rewards: {
      min: 1,
      max: 2,
      chances: [48, 35, 15, 2],
      rarities: ['common', 'rare', 'epic', 'legendary']
    }
  },
  {
    id: 'gold',
    name: 'Gold Chest',
    price: 500,
    image: 'https://i.snipboard.io/DYTsxI.jpg',
    description: 'Guaranteed Rare Character',
    rarity: 'rare',
    rewards: {
      min: 2,
      max: 3,
      chances: [20, 34, 35, 10, 1],
      rarities: ['common', 'rare', 'epic', 'legendary', 'mythic']
    }
  },
  {
    id: 'ruby',
    name: 'Ruby Chest',
    price: 1000,
    image: 'https://i.snipboard.io/8B9HXa.jpg',
    description: 'Chance for Epic Character',
    rarity: 'epic',
    rewards: {
      min: 3,
      max: 4,
      chances: [25, 55, 15, 5],
      rarities: ['rare', 'epic', 'legendary', 'mythic']
    }
  },
  {
    id: 'diamond',
    name: 'Diamond Chest',
    price: 2500,
    image: 'https://i.snipboard.io/GUdFRS.jpg',
    description: 'Guaranteed Epic Character',
    rarity: 'legendary',
    rewards: {
      min: 4,
      max: 7,
      chances: [60, 30, 10],
      rarities: ['epic', 'legendary', 'mythic']
    }
  }
];

const brainPacks = [
  { amount: 100, price: 1.30, label: '$1.30' },
  { amount: 300, price: 3.40, label: '$3.40' },
  { amount: 900, price: 7.20, label: '$7.20' }
];

const coinExchanges = [
  { brains: 100, coins: 200 },
  { brains: 300, coins: 700 },
  { brains: 900, coins: 2400 }
];

interface ChestCardProps {
  chest: ChestType;
  onPurchase: () => void;
  isAffordable: boolean;
  isProcessing: boolean;
}

const rarityColors: Record<string, { border: string; bg: string; text: string }> = {
  common: {
    border: 'border-gray-400',
    bg: 'bg-gray-400/10',
    text: 'text-gray-400'
  },
  rare: {
    border: 'border-blue-400',
    bg: 'bg-blue-400/10',
    text: 'text-blue-400'
  },
  epic: {
    border: 'border-purple-400',
    bg: 'bg-purple-400/10',
    text: 'text-purple-400'
  },
  legendary: {
    border: 'border-yellow-400',
    bg: 'bg-yellow-400/10',
    text: 'text-yellow-400'
  },
  mythic: {
    border: 'border-red-400',
    bg: 'bg-red-400/10',
    text: 'text-red-400'
  },
  default: {
    border: 'border-gray-400',
    bg: 'bg-gray-400/10',
    text: 'text-gray-400'
  }
};

function ChestCard({ chest, onPurchase, isAffordable, isProcessing }: ChestCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 16 // Position below the chest
    });
    setShowTooltip(true);
  };

  const handlePurchase = () => {
    if (!isProcessing && isAffordable) {
      onPurchase();
    }
  };

  const getRarityColors = (rarity: string) => rarityColors[rarity] || rarityColors.default;

  return (
    <div className="relative">
      <div 
        className={`bg-gray-800 rounded-lg overflow-hidden border-2 ${getRarityColors(chest.rarity).border} hover:shadow-lg hover:shadow-purple-500/20 transition-all`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="relative">
          <img src={chest.image} alt={chest.name} className="w-full h-32 object-cover" />
          <div className="absolute top-2 right-2">
            <Info className={`w-5 h-5 ${getRarityColors(chest.rarity).text}`} />
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-1">{chest.name}</h3>
          <p className="text-sm text-gray-400 mb-3">{chest.description}</p>
          <button
            onClick={handlePurchase}
            disabled={!isAffordable || isProcessing}
            className={`
              w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors
              ${isAffordable && !isProcessing
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <Coins className="w-4 h-4" />
            <span>{chest.price}</span>
          </button>
        </div>
      </div>

      {showTooltip && (
        <div 
          className="fixed z-50 transform -translate-x-1/2 pointer-events-none"
          style={{ 
            left: tooltipPosition.x,
            top: tooltipPosition.y
          }}
        >
          <div className="w-0 h-0 border-8 border-transparent border-b-gray-900 mx-auto" />
          <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-700 p-4 w-72 animate-[fadeIn_0.2s_ease-out]">
            <div className="space-y-4">
              {/* Rewards */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span>Rewards</span>
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-300">
                    {chest.rewards.min === chest.rewards.max
                      ? `${chest.rewards.min} Character`
                      : `${chest.rewards.min}-${chest.rewards.max} Characters`
                    }
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {chest.rewards.chances.map((chance, index) => (
                      chance > 0 && (
                        <div 
                          key={chest.rewards.rarities[index]}
                          className={`${getRarityColors(chest.rewards.rarities[index]).bg} rounded px-2 py-1 text-xs flex justify-between`}
                        >
                          <span className="capitalize">{chest.rewards.rarities[index]}</span>
                          <span>{chance}%</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Store() {
  const navigate = useNavigate();
  const { user, setLocalUserData } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [localUser, setLocalUser] = useState(user);
  const [selectedBrainPack, setSelectedBrainPack] = useState<typeof brainPacks[0] | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  const handleChestPurchase = async (chestId: string) => {
    if (!localUser || isProcessing) return;

    const chest = chests.find(c => c.id === chestId);
    if (!chest || localUser.gold < chest.price) return;

    setIsProcessing(true);
    setLoadingMessage('Opening chest...');

    try {
      const { error } = await supabase
        .from('users')
        .update({ gold: localUser.gold - chest.price })
        .eq('id', localUser.id)
        .select()
        .single();

      if (error) throw error;

      setLocalUser(prev => prev ? {
        ...prev,
        gold: prev.gold - chest.price
      } : null);

      navigate(`/open-chest/${chestId}`);
    } catch (err) {
      console.error('Error purchasing chest:', err);
    } finally {
      setIsProcessing(false);
      setLoadingMessage('');
    }
  };

  const handleBrainPurchase = (pack: typeof brainPacks[0]) => {
    setSelectedBrainPack(pack);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    if (selectedBrainPack) {
      setLocalUser(prev => prev ? {
        ...prev,
        rotten_brains: prev.rotten_brains + selectedBrainPack.amount
      } : null);
    }
    setShowPaymentModal(false);
    setSelectedBrainPack(null);
  };

  const handleCoinExchange = async (brains: number, coins: number) => {
    if (!localUser || isProcessing || localUser.rotten_brains < brains) return;

    setIsProcessing(true);
    setLoadingMessage('Exchanging brains for coins...');

    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          rotten_brains: localUser.rotten_brains - brains,
          gold: localUser.gold + coins
        })
        .eq('id', localUser.id)
        .select()
        .single();

      if (error) throw error;

      setLocalUser(prev => prev ? {
        ...prev,
        rotten_brains: prev.rotten_brains - brains,
        gold: prev.gold + coins
      } : null);
    } catch (error) {
      console.error('Error exchanging currency:', error);
    } finally {
      setIsProcessing(false);
      setLoadingMessage('');
    }
  };

  const handleRefillEnergy = async () => {
    if (!localUser || isProcessing || localUser.rotten_brains < 50 || localUser.energy_current >= localUser.energy_max) return;

    setIsProcessing(true);
    setLoadingMessage('Refilling energy...');

    try {
      const { data, error } = await supabase
        .rpc('refill_energy_with_brains');

      if (error) throw error;

      if (data) {
        setLocalUser(prev => prev ? {
          ...prev,
          rotten_brains: prev.rotten_brains - 50,
          energy_current: prev.energy_max
        } : null);
      }
    } catch (err) {
      console.error('Error refilling energy:', err);
    } finally {
      setIsProcessing(false);
      setLoadingMessage('');
    }
  };

  if (!localUser) {
    return (
      <Layout>
        <div className="text-center text-gray-400">Loading...</div>
      </Layout>
    );
  }

  const canRefillEnergy = localUser.rotten_brains >= 50 && localUser.energy_current < localUser.energy_max && !isProcessing;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-400" />
            Store
          </h1>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Chests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {chests.map(chest => (
              <ChestCard
                key={chest.id}
                chest={chest}
                onPurchase={() => handleChestPurchase(chest.id)}
                isAffordable={localUser.gold >= chest.price}
                isProcessing={isProcessing}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Buy Brains</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {brainPacks.map((pack) => (
              <div key={pack.amount} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Brain className="w-12 h-12 text-purple-400" />
                  <div>
                    <div className="text-2xl font-bold">{pack.amount}</div>
                    <div className="text-gray-400">Brains</div>
                  </div>
                </div>
                <button
                  onClick={() => handleBrainPurchase(pack)}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="w-4 h-4" />
                  Buy for {pack.label}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Exchange Brains for Coins</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coinExchanges.map(({ brains, coins }) => (
              <div key={brains} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <span>{brains}</span>
                  </div>
                  <div className="text-xl">→</div>
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    <span>{coins}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleCoinExchange(brains, coins)}
                  disabled={isProcessing || localUser.rotten_brains < brains}
                  className={`
                    w-full py-2 px-4 rounded-lg transition-colors
                    ${localUser.rotten_brains >= brains && !isProcessing
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  Exchange
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Energy Refill</h2>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500/20 p-4 rounded-lg">
                  <Zap className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Full Energy Refill</h3>
                  <p className="text-gray-400">Instantly restore energy to maximum</p>
                </div>
              </div>
              <button
                onClick={handleRefillEnergy}
                disabled={!canRefillEnergy}
                className={`
                  px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2
                  ${canRefillEnergy
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }
                `}
                title={
                  localUser.rotten_brains < 50
                    ? 'Not enough brains'
                    : localUser.energy_current >= localUser.energy_max
                    ? 'Energy is already full'
                    : ''
                }
              >
                <Brain className="w-5 h-5" />
                50 Brains
              </button>
            </div>
          </div>
        </div>

        {showPaymentModal && selectedBrainPack && (
          <PaymentModal
            amount={selectedBrainPack.amount}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedBrainPack(null);
            }}
            onSuccess={handlePaymentSuccess}
          />
        )}

        {isProcessing && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
              <p className="text-lg font-semibold">{loadingMessage}</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}