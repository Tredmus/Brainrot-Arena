import React, { useState, useEffect } from 'react';
import { Shield, Sword, Brain, Zap, Camera, Filter, Heart } from 'lucide-react';
import Layout from '../components/Layout';
import ItemCard from '../components/ItemCard';
import ImageUpload from '../components/ImageUpload';
import { Equipment } from '../types';
import { supabase } from '../lib/supabase';
import { useUser } from '../hooks/useUser';

type FilterType = 'all' | 'boots' | 'belt' | 'armor' | 'gloves' | 'helmet' | 'amulet' | 'cloak' | 'weapon';
type FilterRarity = 'all' | 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export default function Profile() {
  const { user, isLoading: isLoadingUser } = useUser();
  const [selectedTab, setSelectedTab] = useState<'inventory' | 'settings'>('inventory');
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [rarityFilter, setRarityFilter] = useState<FilterRarity>('all');
  const [inventoryItems, setInventoryItems] = useState<Equipment[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [equippedItems, setEquippedItems] = useState<{
    boots: Equipment | null;
    belt: Equipment | null;
    armor: Equipment | null;
    gloves: Equipment | null;
    helmet: Equipment | null;
    amulet: Equipment | null;
    cloak: Equipment | null;
    weapon: Equipment | null;
  }>({
    boots: null,
    belt: null,
    armor: null,
    gloves: null,
    helmet: null,
    amulet: null,
    cloak: null,
    weapon: null
  });

  // Fetch user's items
  useEffect(() => {
    async function loadUserItems() {
      if (!user) return;

      try {
        // Fetch equipped items
        const { data: userItems, error: itemsError } = await supabase
          .from('user_items')
          .select(`
            id,
            is_equipped,
            items (
              id,
              name,
              type,
              icon,
              health_bonus,
              strength_bonus,
              intellect_bonus,
              dexterity_bonus,
              dodge_bonus,
              stealth_bonus,
              crit_resist_bonus,
              energy_bonus,
              rarity,
              effect,
              description
            )
          `)
          .eq('user_id', user.id);

        if (itemsError) throw itemsError;

        if (!userItems) return;

        // Format items
        const formattedItems: Equipment[] = userItems
          .filter(ui => ui.items) // Filter out any null items
          .map(ui => ({
            id: ui.items.id,
            name: ui.items.name,
            type: ui.items.type,
            icon: ui.items.icon,
            stats: {
              health: ui.items.health_bonus || 0,
              strength: ui.items.strength_bonus || 0,
              intellect: ui.items.intellect_bonus || 0,
              dexterity: ui.items.dexterity_bonus || 0,
              dodge: ui.items.dodge_bonus || 0,
              stealth: ui.items.stealth_bonus || 0,
              critResist: ui.items.crit_resist_bonus || 0,
              energy: ui.items.energy_bonus || 0
            },
            rarity: ui.items.rarity,
            effect: ui.items.effect,
            description: ui.items.description
          }));

        // Separate equipped and unequipped items
        const equipped: typeof equippedItems = {
          boots: null,
          belt: null,
          armor: null,
          gloves: null,
          helmet: null,
          amulet: null,
          cloak: null,
          weapon: null
        };
        
        const unequipped: Equipment[] = [];

        formattedItems.forEach((item, index) => {
          if (userItems[index].is_equipped) {
            equipped[item.type] = item;
          } else {
            unequipped.push(item);
          }
        });

        setEquippedItems(equipped);
        setInventoryItems(unequipped);
      } catch (err) {
        console.error('Error loading items:', err);
      } finally {
        setIsLoadingItems(false);
      }
    }

    loadUserItems();
  }, [user]);

  const handleEquipItem = async (item: Equipment) => {
    if (!user) return;

    try {
      // Get the user_items record for this item
      const { data: userItemData, error: userItemError } = await supabase
        .from('user_items')
        .select('id')
        .eq('item_id', item.id)
        .eq('user_id', user.id)
        .single();

      if (userItemError) throw userItemError;
      if (!userItemData) throw new Error('Item not found');

      // If item is already equipped, unequip it
      if (equippedItems[item.type]?.id === item.id) {
        const { error } = await supabase
          .from('user_items')
          .update({ is_equipped: false })
          .eq('id', userItemData.id);

        if (error) throw error;

        setEquippedItems(prev => ({
          ...prev,
          [item.type]: null
        }));
        setInventoryItems(prev => [...prev, item]);
      } else {
        // If another item is equipped in that slot, unequip it first
        if (equippedItems[item.type]) {
          const { error: unequipError } = await supabase
            .from('user_items')
            .update({ is_equipped: false })
            .eq('item_id', equippedItems[item.type]!.id)
            .eq('user_id', user.id);

          if (unequipError) throw unequipError;

          setInventoryItems(prev => [...prev, equippedItems[item.type]!]);
        }

        // Equip the new item
        const { error } = await supabase
          .from('user_items')
          .update({ is_equipped: true })
          .eq('id', userItemData.id);

        if (error) throw error;
        
        setEquippedItems(prev => ({
          ...prev,
          [item.type]: item
        }));
        setInventoryItems(prev => prev.filter(i => i.id !== item.id));
      }
    } catch (err) {
      console.error('Error updating equipment:', err);
    }
  };

  const calculateTotalStats = () => {
    const stats = {
      health: 0,
      strength: 0,
      intellect: 0,
      dexterity: 0,
      dodge: 0,
      stealth: 0,
      critResist: 0,
      energy: 0
    };

    Object.values(equippedItems).forEach(item => {
      if (item) {
        if (item.stats.health) stats.health += item.stats.health;
        if (item.stats.strength) stats.strength += item.stats.strength;
        if (item.stats.intellect) stats.intellect += item.stats.intellect;
        if (item.stats.dexterity) stats.dexterity += item.stats.dexterity;
        if (item.stats.dodge) stats.dodge += item.stats.dodge;
        if (item.stats.stealth) stats.stealth += item.stats.stealth;
        if (item.stats.critResist) stats.critResist += item.stats.critResist;
        if (item.stats.energy) stats.energy += item.stats.energy;
      }
    });

    return stats;
  };

  const handleAvatarUpload = async (url: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ avatar: url })
        .eq('id', user.id);

      if (error) throw error;

      window.location.reload();
    } catch (error) {
      console.error('Error updating avatar:', error);
    } finally {
      setIsEditingAvatar(false);
    }
  };

  const slotIcons = {
    boots: '👢',
    belt: '🎗️',
    armor: '🛡️',
    gloves: '🧤',
    helmet: '⛑️',
    amulet: '📿',
    cloak: '🧥',
    weapon: '⚔️'
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesRarity = rarityFilter === 'all' || item.rarity === rarityFilter;
    return matchesType && matchesRarity;
  });

  const totalStats = calculateTotalStats();

  const EquipmentSlot = ({ type, icon }: { type: keyof typeof equippedItems; icon: string }) => {
    const item = equippedItems[type];
    return (
      <div className="relative">
        <div className={`
          w-20 h-20 border-2 border-dashed border-gray-700 rounded-lg
          flex flex-col items-center justify-center
          ${item ? 'bg-gray-800' : 'bg-gray-900'}
          cursor-pointer
        `}
        onClick={() => item && handleEquipItem(item)}>
          {item ? (
            <ItemCard
              item={item}
              onClick={() => handleEquipItem(item)}
            />
          ) : (
            <div className="text-2xl opacity-50">{icon}</div>
          )}
        </div>
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap capitalize">
          {type}
        </div>
      </div>
    );
  };

  if (isLoadingUser || !user) {
    return (
      <Layout>
        <div className="text-center text-gray-400">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <img
                src={user.avatar}
                alt={user.username}
                className="w-20 h-20 rounded-full object-cover border-4 border-purple-500"
              />
              <button
                onClick={() => setIsEditingAvatar(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>
            <h1 className="text-2xl font-bold">Profile</h1>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedTab('inventory')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedTab === 'inventory'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setSelectedTab('settings')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedTab === 'settings'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Settings
            </button>
          </div>
        </div>

        {isEditingAvatar && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Change Avatar</h2>
              <ImageUpload
                onUpload={handleAvatarUpload}
                defaultImage={user.avatar}
              />
              <button
                onClick={() => setIsEditingAvatar(false)}
                className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {selectedTab === 'inventory' ? (
          <div className="flex gap-8">
            {/* Equipment Slots */}
            <div className="flex-1">
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Total Equipment Stats</h2>
                <div className="grid grid-cols-2 gap-4 p-6 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-400" />
                    <span className="text-gray-400">Health:</span>
                    <span className="text-red-400 font-bold">+{totalStats.health}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sword className="w-5 h-5 text-orange-400" />
                    <span className="text-gray-400">Strength:</span>
                    <span className="text-orange-400 font-bold">+{totalStats.strength}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-400">Intellect:</span>
                    <span className="text-blue-400 font-bold">+{totalStats.intellect}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-400">Dexterity:</span>
                    <span className="text-yellow-400 font-bold">+{totalStats.dexterity}</span>
                  </div>
                  {totalStats.dodge > 0 && (
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-400">Dodge:</span>
                      <span className="text-purple-400 font-bold">+{totalStats.dodge}</span>
                    </div>
                  )}
                  {totalStats.stealth > 0 && (
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-400" />
                      <span className="text-gray-400">Stealth:</span>
                      <span className="text-green-400 font-bold">+{totalStats.stealth}</span>
                    </div>
                  )}
                  {totalStats.critResist > 0 && (
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-indigo-400" />
                      <span className="text-gray-400">Crit Resist:</span>
                      <span className="text-indigo-400 font-bold">+{totalStats.critResist}</span>
                    </div>
                  )}
                  {totalStats.energy > 0 && (
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-cyan-400" />
                      <span className="text-gray-400">Energy:</span>
                      <span className="text-cyan-400 font-bold">+{totalStats.energy}</span>
                    </div>
                  )}
                </div>
              </div>

              <h2 className="text-xl font-semibold mb-8">Equipment</h2>
              <div className="flex flex-col items-center gap-12">
                {/* Top row - Helmet */}
                <EquipmentSlot type="helmet" icon={slotIcons.helmet} />
                
                {/* Second row - Amulet, Cloak */}
                <div className="flex gap-12">
                  <EquipmentSlot type="amulet" icon={slotIcons.amulet} />
                  <EquipmentSlot type="cloak" icon={slotIcons.cloak} />
                </div>
                
                {/* Third row - Weapon, Armor, Gloves */}
                <div className="flex gap-12">
                  <EquipmentSlot type="weapon" icon={slotIcons.weapon} />
                  <EquipmentSlot type="armor" icon={slotIcons.armor} />
                  <EquipmentSlot type="gloves" icon={slotIcons.gloves} />
                </div>
                
                {/* Fourth row - Belt */}
                <EquipmentSlot type="belt" icon={slotIcons.belt} />
                
                {/* Bottom row - Boots */}
                <EquipmentSlot type="boots" icon={slotIcons.boots} />
              </div>
            </div>

            {/* Inventory */}
            <div className="w-[500px]">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Inventory</h2>
                  <div className="flex gap-2">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as FilterType)}
                      className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="boots">Boots</option>
                      <option value="belt">Belt</option>
                      <option value="armor">Armor</option>
                      <option value="gloves">Gloves</option>
                      <option value="helmet">Helmet</option>
                      <option value="amulet">Amulet</option>
                      <option value="cloak">Cloak</option>
                      <option value="weapon">Weapon</option>
                    </select>
                    <select
                      value={rarityFilter}
                      onChange={(e) => setRarityFilter(e.target.value as FilterRarity)}
                      className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
                    >
                      <option value="all">All Rarities</option>
                      <option value="common">Common</option>
                      <option value="rare">Rare</option>
                      <option value="epic">Epic</option>
                      <option value="legendary">Legendary</option>
                      <option value="mythic">Mythic</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {isLoadingItems ? (
                    <div className="col-span-4 text-center py-8 text-gray-400">
                      Loading items...
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="col-span-4 text-center py-8 text-gray-400">
                      No items found
                    </div>
                  ) : (
                    filteredItems.map(item => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onClick={() => handleEquipItem(item)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2"
                  placeholder="Your username"
                  defaultValue={user.username}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2"
                  placeholder="Your email"
                  disabled
                />
              </div>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}