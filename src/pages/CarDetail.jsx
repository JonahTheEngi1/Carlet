import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChevronLeft, Car, User, Phone, Mail, FileText, 
  Calendar, Clock, Loader2, ArrowRight, Archive
} from 'lucide-react';
import moment from 'moment';
import { cn } from "@/lib/utils";

import NoteTimeline from '@/components/car/NoteTimeline';
import PartsList from '@/components/car/PartsList';
import ImageGallery from '@/components/car/ImageGallery';

export default function CarDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const carId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: car, isLoading } = useQuery({
    queryKey: ['car', carId],
    queryFn: () => base44.entities.Car.filter({ id: carId }).then(r => r[0]),
    enabled: !!carId,
  });

  const { data: location } = useQuery({
    queryKey: ['location', car?.location_id],
    queryFn: () => base44.entities.Location.filter({ id: car.location_id }).then(r => r[0]),
    enabled: !!car?.location_id,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['notes', carId],
    queryFn: () => base44.entities.Note.filter({ car_id: carId }, '-created_date'),
    enabled: !!carId,
  });

  const { data: parts = [] } = useQuery({
    queryKey: ['parts', carId],
    queryFn: () => base44.entities.Part.filter({ car_id: carId }),
    enabled: !!carId,
  });

  const updateCarMutation = useMutation({
    mutationFn: (data) => base44.entities.Car.update(carId, { ...data, last_activity: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car', carId] });
      queryClient.invalidateQueries({ queryKey: ['cars'] });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async (content) => {
      const currentStage = location?.stages?.find(s => s.id === car.current_stage_id);
      await base44.entities.Note.create({
        car_id: carId,
        content,
        author_name: user?.full_name || user?.email || 'Unknown',
        stage_name: currentStage?.name || 'Unknown'
      });
      await base44.entities.Car.update(carId, { last_activity: new Date().toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', carId] });
      queryClient.invalidateQueries({ queryKey: ['car', carId] });
    },
  });

  const addPartMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Part.create({ ...data, car_id: carId });
      await base44.entities.Car.update(carId, { last_activity: new Date().toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts', carId] });
      queryClient.invalidateQueries({ queryKey: ['car', carId] });
    },
  });

  const updatePartMutation = useMutation({
    mutationFn: ({ partId, data }) => base44.entities.Part.update(partId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts', carId] });
    },
  });

  const handleStageChange = async (newStageId) => {
    const currentStage = location?.stages?.find(s => s.id === car.current_stage_id);
    const newStage = location?.stages?.find(s => s.id === newStageId);
    
    await updateCarMutation.mutateAsync({ current_stage_id: newStageId });
    
    await base44.entities.Note.create({
      car_id: carId,
      content: `Moved from ${currentStage?.name || 'Unknown'} to ${newStage?.name || 'Unknown'}`,
      author_name: user?.full_name || user?.email || 'System',
      stage_name: newStage?.name || 'Unknown'
    });
    
    queryClient.invalidateQueries({ queryKey: ['notes', carId] });
  };

  const handleArchive = async () => {
    await updateCarMutation.mutateAsync({ is_archived: true });
    window.location.href = createPageUrl('Dashboard');
  };

  if (isLoading || !car) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const stages = location?.stages || [];
  const currentStage = stages.find(s => s.id === car.current_stage_id);
  const currentStageIndex = stages.findIndex(s => s.id === car.current_stage_id);
  const nextStage = stages[currentStageIndex + 1];
  const vehicleDisplay = [car.year, car.make, car.model, car.trim].filter(Boolean).join(' ') || 'Unknown Vehicle';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon" className="mr-3">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-slate-800 truncate">
                {vehicleDisplay}
              </h1>
              {car.license_plate && (
                <span className="font-mono text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {car.license_plate}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stage Control */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Current Stage</p>
              <Badge 
                className="text-base px-4 py-1.5"
                style={{ 
                  backgroundColor: `${currentStage?.color}20`,
                  color: currentStage?.color,
                  borderColor: currentStage?.color
                }}
              >
                {currentStage?.name || 'Unknown'}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Select value={car.current_stage_id} onValueChange={handleStageChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Move to..." />
                </SelectTrigger>
                <SelectContent>
                  {stages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {nextStage && (
                <Button 
                  onClick={() => handleStageChange(nextStage.id)}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {nextStage.name}
                </Button>
              )}
            </div>
          </div>

          {/* Stage Progress */}
          <div className="mt-5 flex items-center gap-1 overflow-x-auto pb-2">
            {stages.map((stage, index) => {
              const isPast = index < currentStageIndex;
              const isCurrent = stage.id === car.current_stage_id;
              return (
                <React.Fragment key={stage.id}>
                  <div 
                    className={cn(
                      "flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all",
                      isCurrent && "ring-2 ring-offset-2",
                      isPast ? "bg-emerald-100 text-emerald-700" :
                      isCurrent ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-500"
                    )}
                    style={isCurrent ? { ringColor: stage.color } : {}}
                  >
                    {stage.name}
                  </div>
                  {index < stages.length - 1 && (
                    <div className={cn(
                      "w-4 h-0.5 flex-shrink-0",
                      isPast ? "bg-emerald-300" : "bg-slate-200"
                    )} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Vehicle & Customer Info */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <Car className="w-4 h-4" />
              Vehicle Info
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">VIN</span>
                <span className="font-mono text-slate-800">{car.vin}</span>
              </div>
              {car.year && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Year</span>
                  <span className="text-slate-800">{car.year}</span>
                </div>
              )}
              {car.make && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Make</span>
                  <span className="text-slate-800">{car.make}</span>
                </div>
              )}
              {car.model && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Model</span>
                  <span className="text-slate-800">{car.model}</span>
                </div>
              )}
              {car.trim && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Trim</span>
                  <span className="text-slate-800">{car.trim}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <User className="w-4 h-4" />
              Customer Info
            </h3>
            <div className="space-y-3 text-sm">
              {car.customer_name && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-800">{car.customer_name}</span>
                </div>
              )}
              {car.customer_phone && (
                <a 
                  href={`tel:${car.customer_phone}`}
                  className="flex items-center gap-2 text-amber-600 hover:text-amber-700"
                >
                  <Phone className="w-4 h-4" />
                  {car.customer_phone}
                </a>
              )}
              {car.customer_email && (
                <a 
                  href={`mailto:${car.customer_email}`}
                  className="flex items-center gap-2 text-amber-600 hover:text-amber-700"
                >
                  <Mail className="w-4 h-4" />
                  {car.customer_email}
                </a>
              )}
              {!car.customer_name && !car.customer_phone && !car.customer_email && (
                <p className="text-slate-400">No customer info</p>
              )}
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="flex items-center gap-6 text-xs text-slate-500 px-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Checked in {moment(car.created_date).format('MMM D, YYYY')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Last activity {moment(car.last_activity || car.updated_date).fromNow()}
          </span>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <NoteTimeline 
            notes={notes}
            onAddNote={(content) => addNoteMutation.mutate(content)}
            isLoading={addNoteMutation.isPending}
            currentStageName={currentStage?.name}
          />
        </div>

        {/* Parts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <PartsList 
            parts={parts}
            onAddPart={(data) => addPartMutation.mutate(data)}
            onUpdatePart={(partId, data) => updatePartMutation.mutate({ partId, data })}
            isLoading={addPartMutation.isPending}
          />
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <ImageGallery 
            checkInImages={car.check_in_images || []}
            checkOutImages={car.check_out_images || []}
            onUpdateImages={(data) => updateCarMutation.mutate(data)}
            isLoading={updateCarMutation.isPending}
          />
        </div>

        {/* Archive */}
        <div className="flex justify-end pt-4">
          <Button 
            variant="outline" 
            onClick={handleArchive}
            className="text-slate-500 hover:text-red-600 hover:border-red-200"
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive Vehicle
          </Button>
        </div>
      </main>
    </div>
  );
}