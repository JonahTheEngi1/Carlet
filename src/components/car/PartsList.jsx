import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, X, DollarSign, Calendar, Store, Pencil, Check } from 'lucide-react';
import moment from 'moment';
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: 'needed', label: 'Needed', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'ordered', label: 'Ordered', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'shipped', label: 'Shipped', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'received', label: 'Received', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'installed', label: 'Installed', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'returned', label: 'Returned', color: 'bg-purple-100 text-purple-700 border-purple-200' }
];

export default function PartsList({ parts, onAddPart, onUpdatePart, isLoading }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newPart, setNewPart] = useState({ name: '', status: 'needed', vendor: '', cost: '', eta: '' });

  const handleSubmit = async () => {
    if (!newPart.name.trim()) return;
    await onAddPart({
      ...newPart,
      cost: newPart.cost ? parseFloat(newPart.cost) : null
    });
    setNewPart({ name: '', status: 'needed', vendor: '', cost: '', eta: '' });
    setIsAdding(false);
  };

  const handleStatusChange = async (partId, newStatus) => {
    await onUpdatePart(partId, { status: newStatus });
    setEditingId(null);
  };

  const getStatusConfig = (status) => STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Parts
        </h3>
        {!isAdding && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsAdding(true)}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Part
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-slate-50 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input 
              placeholder="Part name *"
              value={newPart.name}
              onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
              className="border-slate-200"
            />
            <Select value={newPart.status} onValueChange={(v) => setNewPart({ ...newPart, status: v })}>
              <SelectTrigger className="border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input 
              placeholder="Vendor"
              value={newPart.vendor}
              onChange={(e) => setNewPart({ ...newPart, vendor: e.target.value })}
              className="border-slate-200"
            />
            <Input 
              type="number"
              placeholder="Cost"
              value={newPart.cost}
              onChange={(e) => setNewPart({ ...newPart, cost: e.target.value })}
              className="border-slate-200"
            />
            <Input 
              type="date"
              placeholder="ETA"
              value={newPart.eta}
              onChange={(e) => setNewPart({ ...newPart, eta: e.target.value })}
              className="border-slate-200"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={!newPart.name.trim() || isLoading} className="bg-amber-500 hover:bg-amber-600">
              <Check className="w-4 h-4 mr-1" />
              Add Part
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {parts.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No parts tracked</p>
        ) : (
          parts.map(part => {
            const statusConfig = getStatusConfig(part.status);
            return (
              <div 
                key={part.id} 
                className="bg-white rounded-lg border border-slate-100 p-4 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-slate-800">{part.name}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
                      {part.vendor && (
                        <span className="flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          {part.vendor}
                        </span>
                      )}
                      {part.cost && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {part.cost.toFixed(2)}
                        </span>
                      )}
                      {part.eta && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          ETA: {moment(part.eta).format('MMM D')}
                        </span>
                      )}
                    </div>
                  </div>
                  {editingId === part.id ? (
                    <Select value={part.status} onValueChange={(v) => handleStatusChange(part.id, v)}>
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge 
                      variant="secondary" 
                      className={cn("cursor-pointer hover:opacity-80", statusConfig.color)}
                      onClick={() => setEditingId(part.id)}
                    >
                      {statusConfig.label}
                      <Pencil className="w-3 h-3 ml-1" />
                    </Badge>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}