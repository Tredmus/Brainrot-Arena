import React, { useState, useEffect } from 'react';
import { Coins, Brain, Zap, Timer } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CurrencyDisplayProps {
  gold: number;
  rottenBrains: number;
  energy: {
    current: number;
    max: number;
  };
}

export default function CurrencyDisplay({ gold, rottenBrains, energy }: CurrencyDisplayProps) {
  const [nextEnergyIn, setNextEnergyIn] = useState<string>('');
  const [localEnergy, setLocalEnergy] = useState(energy.current);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let mounted = true;

    const updateEnergy = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        const { data: refreshedUser } = await supabase.rpc('refresh_user_energy');
        if (refreshedUser && mounted) {
          setLocalEnergy(refreshedUser.energy_current);
          localStorage.setItem('lastEnergyUpdate', refreshedUser.last_energy_update);
        }
      } catch (err) {
        console.error('Error refreshing energy:', err);
      }
    };

    const updateTimer = () => {
      if (!mounted) return;
      
      if (localEnergy >= energy.max) {
        setNextEnergyIn('');
        return;
      }

      const now = Date.now();
      const lastUpdate = new Date(localStorage.getItem('lastEnergyUpdate') || now).getTime();
      const timePassed = Math.floor((now - lastUpdate) / 1000);
      const timeLeft = 180 - (timePassed % 180);

      if (timeLeft <= 0) {
        updateEnergy();
      } else {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        setNextEnergyIn(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    // Initial update
    updateTimer();
    updateEnergy();
    
    // Update timer every second
    timer = setInterval(updateTimer, 1000);

    // Update energy every 3 minutes
    const energyTimer = setInterval(updateEnergy, 180000);

    return () => {
      mounted = false;
      clearInterval(timer);
      clearInterval(energyTimer);
    };
  }, [localEnergy, energy.max]);

  // Update local energy when prop changes
  useEffect(() => {
    setLocalEnergy(energy.current);
  }, [energy.current]);

  return (
    <div className="flex space-x-4">
      <div className="flex items-center space-x-2 bg-yellow-900/30 px-4 py-2 rounded-lg">
        <Coins className="h-5 w-5 text-yellow-500" />
        <span className="text-yellow-500 font-semibold">{gold}</span>
      </div>
      <div className="flex items-center space-x-2 bg-green-900/30 px-4 py-2 rounded-lg">
        <Brain className="h-5 w-5 text-green-400 rotate-12" />
        <span className="text-green-400 font-semibold">{rottenBrains}</span>
      </div>
      <div className="flex items-center space-x-2 bg-blue-900/30 px-4 py-2 rounded-lg group relative">
        <Zap className="h-5 w-5 text-blue-400" />
        <span className="text-blue-400 font-semibold">
          {localEnergy}/{energy.max}
        </span>
        {nextEnergyIn && localEnergy < energy.max && (
          <div className="flex items-center gap-1 ml-2 text-xs text-gray-400">
            <Timer className="w-3 h-3" />
            {nextEnergyIn}
          </div>
        )}
        <div className="absolute -bottom-8 left-0 hidden group-hover:block bg-gray-800 text-xs text-gray-300 px-2 py-1 rounded whitespace-nowrap">
          Battle Energy
        </div>
      </div>
    </div>
  );
}