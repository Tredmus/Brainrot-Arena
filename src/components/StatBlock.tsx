import React from 'react';
import { Heart, Sword, Brain, Zap } from 'lucide-react';

interface StatBlockProps {
  stats: {
    health: number;
    strength: number;
    intellect: number;
    dexterity: number;
  };
  showBase?: {
    health: number;
    strength: number;
    intellect: number;
    dexterity: number;
  };
}

export default function StatBlock({ stats, showBase }: StatBlockProps) {
  const getStatDifference = (stat: keyof typeof stats) => {
    if (!showBase) return null;
    const difference = stats[stat] - showBase[stat];
    if (difference === 0) return null;
    return difference > 0 ? `+${difference}` : difference;
  };

  return (
    <div className="grid grid-cols-2 gap-4 p-6 bg-gray-800 rounded-lg">
      <div className="flex items-center space-x-3">
        <Heart className="w-5 h-5 text-red-400" />
        <div>
          <div className="text-sm text-gray-400">Health</div>
          <div className="flex items-baseline gap-2">
            <div className="text-lg font-bold text-red-400">{stats.health}</div>
            {getStatDifference('health') && (
              <div className="text-sm font-medium text-green-400">
                ({getStatDifference('health')})
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <Sword className="w-5 h-5 text-orange-400" />
        <div>
          <div className="text-sm text-gray-400">Strength</div>
          <div className="flex items-baseline gap-2">
            <div className="text-lg font-bold text-orange-400">{stats.strength}</div>
            {getStatDifference('strength') && (
              <div className="text-sm font-medium text-green-400">
                ({getStatDifference('strength')})
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <Brain className="w-5 h-5 text-blue-400" />
        <div>
          <div className="text-sm text-gray-400">Intellect</div>
          <div className="flex items-baseline gap-2">
            <div className="text-lg font-bold text-blue-400">{stats.intellect}</div>
            {getStatDifference('intellect') && (
              <div className="text-sm font-medium text-green-400">
                ({getStatDifference('intellect')})
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <Zap className="w-5 h-5 text-yellow-400" />
        <div>
          <div className="text-sm text-gray-400">Dexterity</div>
          <div className="flex items-baseline gap-2">
            <div className="text-lg font-bold text-yellow-400">{stats.dexterity}</div>
            {getStatDifference('dexterity') && (
              <div className="text-sm font-medium text-green-400">
                ({getStatDifference('dexterity')})
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}