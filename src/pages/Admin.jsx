import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, MapPin, Trash2, GripVertical, Pencil, 
  Loader2, Settings, Palette, X, Check, Shield
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from "@/lib/utils";
import UserManagement from '@/components/admin/UserManagement';

const STAGE_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
];

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export default function Admin() {
  const [user, setUser] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: '', timezone: 'America/New_York', stages: [] });
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState(STAGE_COLORS[0]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  const createLocationMutation = useMutation({
    mutationFn: (data) => base44.entities.Location.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setShowLocationModal(false);
      setNewLocation({ name: '', timezone: 'America/New_York', stages: [] });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Location.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (id) => base44.entities.Location.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });

  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    const newStage = { id: generateId(), name: newStageName.trim(), color: newStageColor };
    if (editingLocation) {
      const updatedStages = [...(editingLocation.stages || []), newStage];
      updateLocationMutation.mutate({ id: editingLocation.id, data: { stages: updatedStages } });
      setEditingLocation({ ...editingLocation, stages: updatedStages });
    } else {
      setNewLocation(prev => ({ ...prev, stages: [...prev.stages, newStage] }));
    }
    setNewStageName('');
    setNewStageColor(STAGE_COLORS[Math.floor(Math.random() * STAGE_COLORS.length)]);
  };

  const handleRemoveStage = (stageId) => {
    if (editingLocation) {
      const updatedStages = editingLocation.stages.filter(s => s.id !== stageId);
      updateLocationMutation.mutate({ id: editingLocation.id, data: { stages: updatedStages } });
      setEditingLocation({ ...editingLocation, stages: updatedStages });
    } else {
      setNewLocation(prev => ({ ...prev, stages: prev.stages.filter(s => s.id !== stageId) }));
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const stages = editingLocation ? [...editingLocation.stages] : [...newLocation.stages];
    const [removed] = stages.splice(result.source.index, 1);
    stages.splice(result.destination.index, 0, removed);
    
    if (editingLocation) {
      updateLocationMutation.mutate({ id: editingLocation.id, data: { stages } });
      setEditingLocation({ ...editingLocation, stages });
    } else {
      setNewLocation(prev => ({ ...prev, stages }));
    }
  };

  const handleCreateLocation = () => {
    if (!newLocation.name.trim()) return;
    createLocationMutation.mutate({
      ...newLocation,
      is_active: true
    });
  };

  if (!user?.is_platform_admin && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Access Denied</h2>
          <p className="text-slate-500">You must be a platform admin to access this page.</p>
        </div>
      </div>
    );
  }

  const currentStages = editingLocation ? editingLocation.stages : newLocation.stages;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-600" />
              <h1 className="text-xl font-bold text-slate-800">Admin</h1>
            </div>
            <Button 
              onClick={() => {
                setEditingLocation(null);
                setNewLocation({ name: '', timezone: 'America/New_York', stages: [] });
                setShowLocationModal(true);
              }}
              className="bg-amber-500 hover:bg-amber-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">No Locations</h2>
            <p className="text-slate-500 mb-4">Create your first location to get started.</p>
            <Button onClick={() => setShowLocationModal(true)} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Location
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* User Management Section */}
            <UserManagement locations={locations} />

            {/* Locations Section */}
            <div>
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5" />
                Locations
              </h2>
              <div className="grid gap-4">
            {locations.map(location => (
              <Card key={location.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{location.name}</CardTitle>
                      <p className="text-sm text-slate-500">{location.timezone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingLocation(location);
                        setShowLocationModal(true);
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-slate-400 hover:text-red-500"
                      onClick={() => deleteLocationMutation.mutate(location.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  <div className="flex flex-wrap gap-2">
                    {location.stages?.map((stage, index) => (
                      <Badge 
                        key={stage.id} 
                        variant="secondary"
                        style={{ 
                          backgroundColor: `${stage.color}20`,
                          color: stage.color,
                          borderColor: stage.color
                        }}
                      >
                        {index + 1}. {stage.name}
                      </Badge>
                    ))}
                    {(!location.stages || location.stages.length === 0) && (
                      <span className="text-slate-400 text-sm">No stages defined</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Dialog open={showLocationModal} onOpenChange={(open) => {
        setShowLocationModal(open);
        if (!open) setEditingLocation(null);
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {editingLocation ? 'Edit Location' : 'New Location'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Location Name</Label>
                <Input 
                  value={editingLocation ? editingLocation.name : newLocation.name}
                  onChange={(e) => {
                    if (editingLocation) {
                      setEditingLocation({ ...editingLocation, name: e.target.value });
                    } else {
                      setNewLocation({ ...newLocation, name: e.target.value });
                    }
                  }}
                  placeholder="Main Shop"
                />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input 
                  value={editingLocation ? editingLocation.timezone : newLocation.timezone}
                  onChange={(e) => {
                    if (editingLocation) {
                      setEditingLocation({ ...editingLocation, timezone: e.target.value });
                    } else {
                      setNewLocation({ ...newLocation, timezone: e.target.value });
                    }
                  }}
                  placeholder="America/New_York"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Workflow Stages</Label>
              <div className="flex gap-2">
                <Input 
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  placeholder="Stage name"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
                />
                <div className="relative">
                  <button
                    type="button"
                    className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden"
                    style={{ backgroundColor: newStageColor }}
                  >
                    <Palette className="w-4 h-4 text-white mx-auto opacity-70" />
                  </button>
                  <input 
                    type="color"
                    value={newStageColor}
                    onChange={(e) => setNewStageColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                <Button onClick={handleAddStage} size="icon" className="bg-amber-500 hover:bg-amber-600">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="stages">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {currentStages.map((stage, index) => (
                        <Draggable key={stage.id} draggableId={stage.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200",
                                snapshot.isDragging && "shadow-lg"
                              )}
                            >
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="w-4 h-4 text-slate-400" />
                              </div>
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: stage.color }}
                              />
                              <span className="flex-1 font-medium text-slate-700">{stage.name}</span>
                              <span className="text-xs text-slate-400">{index + 1}</span>
                              <button 
                                onClick={() => handleRemoveStage(stage.id)}
                                className="text-slate-400 hover:text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {currentStages.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                  Add stages to define your workflow
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="ghost" onClick={() => setShowLocationModal(false)}>
              Cancel
            </Button>
            {editingLocation ? (
              <Button 
                onClick={() => {
                  updateLocationMutation.mutate({ 
                    id: editingLocation.id, 
                    data: { name: editingLocation.name, timezone: editingLocation.timezone }
                  });
                  setShowLocationModal(false);
                }}
                className="bg-amber-500 hover:bg-amber-600"
              >
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            ) : (
              <Button 
                onClick={handleCreateLocation}
                disabled={!newLocation.name.trim() || createLocationMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {createLocationMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Create Location
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}