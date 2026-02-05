import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Loader2, ChevronLeft, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import StageCard from '@/components/dashboard/StageCard';
import CarRow from '@/components/dashboard/CarRow';
import SearchBar from '@/components/common/SearchBar';
import AddCarModal from '@/components/car/AddCarModal';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCar, setShowAddCar] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const u = await base44.auth.me();
      setUser(u);
    };
    loadUser();
  }, []);

  const { data: locations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  const userLocation = locations.find(l => l.id === user?.location_id) || locations[0];

  const { data: cars = [], isLoading: loadingCars } = useQuery({
    queryKey: ['cars', userLocation?.id],
    queryFn: () => base44.entities.Car.filter({ location_id: userLocation.id, is_archived: false }),
    enabled: !!userLocation?.id,
  });

  const { data: allParts = [] } = useQuery({
    queryKey: ['parts', cars.map(c => c.id)],
    queryFn: async () => {
      if (cars.length === 0) return [];
      const partsPromises = cars.map(car => base44.entities.Part.filter({ car_id: car.id }));
      const results = await Promise.all(partsPromises);
      return results.flat();
    },
    enabled: cars.length > 0,
  });

  const createCarMutation = useMutation({
    mutationFn: (data) => base44.entities.Car.create({
      ...data,
      location_id: userLocation.id,
      current_stage_id: userLocation.stages[0]?.id,
      last_activity: new Date().toISOString(),
      check_in_images: [],
      check_out_images: [],
      is_archived: false
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      setShowAddCar(false);
    },
  });

  const stages = userLocation?.stages || [];

  const getCarCountForStage = (stageId) => {
    return cars.filter(c => c.current_stage_id === stageId).length;
  };

  const getCarsForStage = (stageId) => {
    return cars.filter(c => c.current_stage_id === stageId);
  };

  const getPartsForCar = (carId) => {
    return allParts.filter(p => p.car_id === carId);
  };

  const filteredCars = searchQuery
    ? cars.filter(car => {
        const query = searchQuery.toLowerCase();
        return (
          car.vin?.toLowerCase().includes(query) ||
          car.license_plate?.toLowerCase().includes(query) ||
          car.customer_name?.toLowerCase().includes(query) ||
          car.customer_phone?.includes(query) ||
          car.customer_email?.toLowerCase().includes(query) ||
          car.make?.toLowerCase().includes(query) ||
          car.model?.toLowerCase().includes(query)
        );
      })
    : [];

  if (loadingLocations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!userLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No Location Assigned</h2>
          <p className="text-slate-500">Please contact an administrator to assign you to a location.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {selectedStage && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSelectedStage(null)}
                  className="mr-1"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  {selectedStage 
                    ? stages.find(s => s.id === selectedStage)?.name 
                    : 'Dashboard'
                  }
                </h1>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin className="w-3.5 h-3.5" />
                  {userLocation.name}
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddCar(true)}
              className="bg-amber-500 hover:bg-amber-600 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Check In
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search VIN, plate, customer..."
          className="mb-6"
        />

        {searchQuery ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-700">
                Search Results ({filteredCars.length})
              </h2>
            </div>
            {filteredCars.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No vehicles found matching "{searchQuery}"
              </div>
            ) : (
              filteredCars.map(car => (
                <CarRow key={car.id} car={car} parts={getPartsForCar(car.id)} />
              ))
            )}
          </div>
        ) : selectedStage ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            {loadingCars ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : getCarsForStage(selectedStage).length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No vehicles in this stage
              </div>
            ) : (
              getCarsForStage(selectedStage).map(car => (
                <CarRow key={car.id} car={car} parts={getPartsForCar(car.id)} />
              ))
            )}
          </motion.div>
        ) : (
          <div className="grid gap-3">
            <AnimatePresence>
              {stages.map((stage, index) => (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <StageCard 
                    stage={stage}
                    carCount={getCarCountForStage(stage.id)}
                    onClick={() => setSelectedStage(stage.id)}
                    isActive={false}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <AddCarModal 
        open={showAddCar}
        onClose={() => setShowAddCar(false)}
        onSubmit={(data) => createCarMutation.mutate(data)}
        isLoading={createCarMutation.isPending}
      />
    </div>
  );
}