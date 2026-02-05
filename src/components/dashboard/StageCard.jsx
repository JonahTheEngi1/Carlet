import React from 'react';
import { Card } from "@/components/ui/card";
import { ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function StageCard({ stage, carCount, onClick, isActive }) {
  return (
    <Card 
      onClick={onClick}
      className={cn(
        "group cursor-pointer transition-all duration-300 border-0 overflow-hidden",
        "hover:shadow-lg hover:scale-[1.02]",
        isActive ? "ring-2 ring-amber-500 shadow-lg" : "hover:ring-1 hover:ring-slate-300"
      )}
    >
      <div className="relative p-5">
        <div 
          className="absolute top-0 left-0 w-1.5 h-full"
          style={{ backgroundColor: stage.color || '#64748b' }}
        />
        <div className="flex items-center justify-between">
          <div className="pl-3">
            <h3 className="font-semibold text-slate-800 text-lg tracking-tight">
              {stage.name}
            </h3>
            <p className="text-slate-500 text-sm mt-0.5">
              {carCount} {carCount === 1 ? 'vehicle' : 'vehicles'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl transition-all",
                carCount > 0 ? "bg-slate-100 text-slate-700" : "bg-slate-50 text-slate-400"
              )}
            >
              {carCount}
            </div>
            <ChevronRight 
              className={cn(
                "w-5 h-5 text-slate-400 transition-transform duration-200",
                "group-hover:translate-x-1 group-hover:text-slate-600"
              )}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}