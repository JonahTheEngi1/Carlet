import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Car, Clock, Package, ChevronRight } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import moment from 'moment';
import { cn } from "@/lib/utils";

const partStatusColors = {
  needed: 'bg-red-100 text-red-700',
  ordered: 'bg-amber-100 text-amber-700',
  shipped: 'bg-blue-100 text-blue-700',
  received: 'bg-emerald-100 text-emerald-700',
  installed: 'bg-slate-100 text-slate-600',
  returned: 'bg-purple-100 text-purple-700'
};

export default function CarRow({ car, parts = [] }) {
  const pendingParts = parts.filter(p => !['installed', 'returned'].includes(p.status));
  const vehicleDisplay = [car.year, car.make, car.model].filter(Boolean).join(' ') || 'Unknown Vehicle';
  
  return (
    <Link 
      to={createPageUrl(`CarDetail?id=${car.id}`)}
      className="block"
    >
      <div className={cn(
        "group px-5 py-4 border-b border-slate-100 last:border-0",
        "hover:bg-slate-50/80 transition-all duration-200 cursor-pointer"
      )}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Car className="w-5 h-5 text-slate-500" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-slate-800 truncate">
                {vehicleDisplay}
              </h4>
              <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                {car.license_plate && (
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">
                    {car.license_plate}
                  </span>
                )}
                {car.customer_name && (
                  <span className="truncate">{car.customer_name}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            {pendingParts.length > 0 && (
              <Badge variant="secondary" className={cn("gap-1", partStatusColors[pendingParts[0]?.status])}>
                <Package className="w-3 h-3" />
                {pendingParts.length}
              </Badge>
            )}
            
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {moment(car.last_activity || car.updated_date).fromNow()}
            </div>
            
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}