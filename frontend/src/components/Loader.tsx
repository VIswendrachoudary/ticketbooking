import React from 'react';
import { Ticket } from 'lucide-react';

interface LoaderProps {
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ message = 'Loading System Engine...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl">
      <div className="flex flex-col items-center space-y-6 text-center">
        {/* Glowing Ticket Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 animate-pulse glow-indigo">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
              <Ticket className="h-10 w-10 text-indigo-400 animate-bounce" />
            </div>
          </div>
          <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-xl animate-ping -z-10" />
        </div>

        {/* Status text */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white tracking-wide">{message}</h3>
          <div className="flex items-center justify-center space-x-1">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-ping delay-100" />
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping delay-200" />
          </div>
        </div>
      </div>
    </div>
  );
};
