import React from 'react';
import { Popcorn, Glasses, Zap, ShoppingBag } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export interface AddonItem {
  id: string;
  name: string;
  price: number; // in USD
  icon: any;
  description: string;
}

export const AVAILABLE_ADDONS: AddonItem[] = [
  {
    id: 'popcorn',
    name: 'Gourmet Popcorn & Drink Combo',
    price: 12,
    icon: Popcorn,
    description: 'Large Butter Popcorn + Large Soda',
  },
  {
    id: 'glasses',
    name: 'IMAX 3D Laser Glasses',
    price: 5,
    icon: Glasses,
    description: 'Reusable Premium 3D Glasses',
  },
  {
    id: 'vip_pass',
    name: 'VIP Fast-Track Express Entry',
    price: 20,
    icon: Zap,
    description: 'Skip queue with priority entrance & lounge',
  },
];

interface AddonSelectorProps {
  selectedAddonIds: string[];
  onToggleAddon: (id: string) => void;
}

export const AddonSelector: React.FC<AddonSelectorProps> = ({
  selectedAddonIds,
  onToggleAddon,
}) => {
  const { formatPrice } = useCurrency();

  return (
    <div className="space-y-3 pt-3 border-t border-white/10">
      <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider">
        <ShoppingBag className="h-4 w-4 text-indigo-400" /> Event Add-ons & VIP Merch
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {AVAILABLE_ADDONS.map((addon) => {
          const Icon = addon.icon;
          const isSelected = selectedAddonIds.includes(addon.id);

          return (
            <div
              key={addon.id}
              onClick={() => onToggleAddon(addon.id)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                isSelected
                  ? 'bg-indigo-950/60 border-indigo-400 glow-indigo text-white'
                  : 'glass-panel border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <Icon className={`h-5 w-5 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="font-black text-xs text-emerald-400">{formatPrice(addon.price)}</span>
              </div>

              <div>
                <p className="font-extrabold text-xs leading-tight">{addon.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{addon.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
