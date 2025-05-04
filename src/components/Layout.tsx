import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Package, Swords } from 'lucide-react';
import { supabase } from '../lib/supabase';
import CurrencyDisplay from './CurrencyDisplay';
import { useUser } from '../hooks/useUser';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { user } = useUser();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="flex items-center justify-center h-screen">
          <div className="text-xl text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-xl font-bold text-purple-400 hover:text-purple-300"
              >
                <img 
                  src="/images/logo.png" 
                  alt="Brain Rot Arena Logo" 
                  className="h-12 w-12 rounded-full"
                />
                <span>Brain Rot Arena</span>
              </button>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/store')}
                  className="group relative px-6 py-2 rounded-lg overflow-hidden transition-all hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 opacity-75 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gray-900/50" />
                  <div className="relative flex items-center gap-2 text-white">
                    <Package className="w-5 h-5" />
                    <span className="font-medium">Store</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-pink-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </button>

                <button
                  onClick={() => navigate('/arena')}
                  className="group relative px-6 py-2 rounded-lg overflow-hidden transition-all hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-orange-600 opacity-75 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gray-900/50" />
                  <div className="relative flex items-center gap-2 text-white">
                    <Swords className="w-5 h-5" />
                    <span className="font-medium">Arena</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <CurrencyDisplay
                gold={user.gold}
                rottenBrains={user.rotten_brains}
                energy={{
                  current: user.energy_current,
                  max: user.energy_max
                }}
              />
              <button
                onClick={() => navigate('/profile')}
                className="p-2 rounded-full hover:bg-gray-700 transition-all hover:scale-110"
              >
                <User className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-gray-700 transition-all hover:scale-110"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}