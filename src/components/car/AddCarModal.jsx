import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Car, User, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AddCarModal({ open, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    vin: '',
    year: '',
    make: '',
    model: '',
    trim: '',
    license_plate: '',
    customer_name: '',
    customer_phone: '',
    customer_email: ''
  });
  const [decoding, setDecoding] = useState(false);

  const handleVinDecode = async (vinValue) => {
    const vin = vinValue || formData.vin;
    if (vin.length !== 17) return;
    
    setDecoding(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Decode this VIN: ${vin}. Return accurate vehicle information based on the VIN structure. The first 3 characters identify the manufacturer, characters 4-8 describe the vehicle attributes, character 9 is a check digit, character 10 is the model year, character 11 is the plant code, and characters 12-17 are the serial number.`,
      response_json_schema: {
        type: "object",
        properties: {
          year: { type: "number" },
          make: { type: "string" },
          model: { type: "string" },
          trim: { type: "string" }
        }
      }
    });
    
    if (result) {
      setFormData(prev => ({
        ...prev,
        year: result.year || prev.year,
        make: result.make || prev.make,
        model: result.model || prev.model,
        trim: result.trim || prev.trim
      }));
    }
    setDecoding(false);
  };

  const handleVinChange = (value) => {
    const vin = value.toUpperCase();
    setFormData(prev => ({ ...prev, vin }));
    if (vin.length === 17) {
      handleVinDecode(vin);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      year: formData.year ? parseInt(formData.year) : null
    });
    setFormData({
      vin: '',
      year: '',
      make: '',
      model: '',
      trim: '',
      license_plate: '',
      customer_name: '',
      customer_phone: '',
      customer_email: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Check In Vehicle
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>VIN *</Label>
              <div className="flex gap-2">
                <Input 
                  value={formData.vin}
                  onChange={(e) => handleVinChange(e.target.value)}
                  placeholder="Enter 17-character VIN"
                  className="font-mono uppercase"
                  maxLength={17}
                  required
                />
                {decoding && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Year</Label>
                <Input 
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Make</Label>
                <Input 
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="Toyota"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input 
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Camry"
                />
              </div>
              <div className="space-y-2">
                <Label>Trim</Label>
                <Input 
                  value={formData.trim}
                  onChange={(e) => setFormData({ ...formData, trim: e.target.value })}
                  placeholder="XSE"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>License Plate</Label>
              <Input 
                value={formData.license_plate}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                placeholder="ABC1234"
                className="uppercase"
              />
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 mb-3 text-sm text-slate-600">
                <User className="w-4 h-4" />
                Customer Information
              </div>
              <div className="space-y-3">
                <Input 
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="Customer Name"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    placeholder="Phone"
                    type="tel"
                  />
                  <Input 
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    placeholder="Email"
                    type="email"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.vin || isLoading}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Check In
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}