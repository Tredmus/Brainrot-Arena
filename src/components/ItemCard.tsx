import React, { useState } from 'react';
import { InventoryItem } from '../types';

interface ItemCardProps {
  item: InventoryItem;
  onClick?: () => void;
}

const rarityColors = {
  common: 'border-gray-400',
  rare: 'border-blue-400',
  epic: 'border-purple-400',
  legendary: 'border-yellow-400',
  mythic: 'border-red-400'
};

const statIcons = {
  health: '❤️',
  strength: '⚔️',
  intellect: '🧠',
  dexterity: '🏃',
  dodge: '🛡️',
  stealth: '👻',
  critResist: '🎯',
  energy: '⚡'
};

export default function ItemCard({ item, onClick }: ItemCardProps) {
  const [tooltipStyle, setTooltipStyle] = useState({ top: 0, left: 0 });
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipStyle({
      top: rect.top - 10,
      left: rect.left + rect.width / 2
    });
    setShowTooltip(true);
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowTooltip(false)}
      className="relative"
    >
      {/* Item Image */}
      <div className={`
        relative aspect-square overflow-hidden rounded-lg cursor-pointer
        transition-all duration-200 hover:scale-105
        border-2 ${rarityColors[item.rarity]}
      `}>
        <img 
          src={item.icon} 
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Hover Tooltip */}
      {showTooltip && (
        <div 
          className="fixed z-[100] w-48 pointer-events-none"
          style={{
            top: tooltipStyle.top,
            left: tooltipStyle.left,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-gray-900 rounded-lg shadow-lg p-3 border border-gray-700">
            {/* Item Name and Type */}
            <div className="mb-2">
              <h3 className="font-semibold text-white">{item.name}</h3>
              <div className="text-xs text-gray-400 capitalize">{item.type}</div>
            </div>

            {/* Stats */}
            <div className="space-y-1">
              {Object.entries(item.stats).map(([stat, value]) => (
                value > 0 && (
                  <div key={stat} className="flex items-center text-sm">
                    <span className="mr-2">{statIcons[stat as keyof typeof statIcons]}</span>
                    <span className="text-green-400">+{value} {stat}</span>
                  </div>
                )
              ))}
            </div>

            {/* Effect */}
            {item.effect && (
              <div className="mt-2 text-sm text-blue-400">
                Effect: {item.effect}
              </div>
            )}

            {/* Rarity */}
            <div className={`mt-2 text-xs font-semibold capitalize ${rarityColors[item.rarity].replace('border', 'text')}`}>
              {item.rarity}
            </div>
          </div>
          {/* Tooltip Arrow */}
          <div className="
            absolute left-1/2 -translate-x-1/2 -bottom-2
            border-8 border-transparent border-t-gray-900
          "/>
        </div>
      )}
    </div>
  );
}