import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Swords, Search, Trophy, Users, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useUser } from '../hooks/useUser';

interface Opponent {
  id: string;
  username: string;
  avatar: string;
  glory: number;
  rank?: number;
  hasTeam?: boolean;
}

export default function BattleArena() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadOpponents() {
      if (!user) return;

      try {
        // First get all users ordered by glory
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('glory', { ascending: false });

        if (usersError) throw usersError;

        // Then get all battle teams
        const { data: battleTeams, error: teamsError } = await supabase
          .from('battle_teams')
          .select('user_id, character1_id, character2_id, character3_id');

        if (teamsError) throw teamsError;

        // Map users to opponents and check if they have a complete team
        const rankedUsers = users.map((u, index) => ({
          ...u,
          rank: index + 1,
          hasTeam: battleTeams?.some(team => 
            team.user_id === u.id && 
            team.character1_id && 
            team.character2_id && 
            team.character3_id
          )
        }));

        setOpponents(rankedUsers);
      } catch (err) {
        console.error('Error loading opponents:', err);
        setError('Failed to load opponents');
      } finally {
        setIsLoading(false);
      }
    }

    loadOpponents();
  }, [user]);

  const startBattle = (opponentId: string) => {
    navigate(`/arena/battle/${opponentId}`);
  };

  const filteredOpponents = opponents.filter(opponent =>
    opponent.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <Layout>
        <div className="text-center text-gray-400">Please log in to access the Battle Arena</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 p-8 bg-gray-800 rounded-lg">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-xl text-red-400">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Battle Arena Rankings
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400">
              {opponents.length} Opponents
            </span>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search opponents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-400">Loading rankings...</p>
          </div>
        ) : filteredOpponents.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {searchQuery ? 'No opponents found matching your search' : 'No opponents available'}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-700 font-semibold text-sm">
              <div className="col-span-1 text-gray-400">Rank</div>
              <div className="col-span-5 text-gray-400">Player</div>
              <div className="col-span-4 text-gray-400 text-right group relative">
                Glory
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-900 text-xs text-gray-300 p-2 rounded-lg whitespace-nowrap border border-gray-700 w-64">
                  Glory points are earned from battles. You can only earn glory when battling players with similar or higher glory (no more than 200 points below you).
                </div>
              </div>
              <div className="col-span-2"></div>
            </div>

            {filteredOpponents.map((opponent) => {
              const gloryDiff = (user?.glory || 0) - opponent.glory;
              const canEarnGlory = gloryDiff <= 200;
              
              return (
                <div
                  key={opponent.id}
                  className={`
                    grid grid-cols-12 gap-4 p-4 items-center border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors
                    ${opponent.rank === 1 ? 'bg-yellow-400/5' :
                      opponent.rank === 2 ? 'bg-gray-400/5' :
                      opponent.rank === 3 ? 'bg-amber-600/5' : ''}
                  `}
                >
                  <div className="col-span-1 text-gray-400">
                    #{opponent.rank}
                  </div>

                  <div className="col-span-5 flex items-center gap-3">
                    <img
                      src={opponent.avatar}
                      alt={opponent.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="font-medium">{opponent.username}</span>
                  </div>

                  <div className="col-span-4 text-right flex items-center justify-end gap-2 group relative">
                    <span className={`${canEarnGlory ? 'text-yellow-400' : 'text-gray-500'}`}>
                      {opponent.glory}
                    </span>
                    <Trophy className={`w-4 h-4 ${canEarnGlory ? 'text-yellow-400' : 'text-gray-500'}`} />
                    
                    {!canEarnGlory && opponent.glory < (user?.glory || 0) && (
                      <div className="absolute -top-8 right-0 hidden group-hover:block bg-gray-900 text-xs text-gray-300 p-2 rounded-lg whitespace-nowrap border border-gray-700">
                        Too low glory to earn points
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <button
                      onClick={() => startBattle(opponent.id)}
                      disabled={opponent.id === user?.id || !opponent.hasTeam}
                      className={`
                        px-4 py-2 rounded-lg font-medium text-sm transition-colors
                        flex items-center gap-2
                        ${opponent.id === user?.id
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : !opponent.hasTeam
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                        }
                      `}
                      title={!opponent.hasTeam ? 'This player has not set up their battle team yet' : ''}
                    >
                      <Swords className="w-4 h-4" />
                      {opponent.id === user?.id ? 'Self' : !opponent.hasTeam ? 'No Team' : 'Battle'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}