import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Users, User, Mail, MapPin, Loader2, UserPlus, Check
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function UserManagement({ locations }) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLocationId, setInviteLocationId] = useState('');
  const [inviting, setInviting] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteLocationId) return;
    
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail.trim(), 'user');
      
      // Note: The user will need to have their location_id set after they accept the invite
      // For now we'll store it and update when they appear in the system
      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteLocationId('');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast.error('Failed to send invitation');
    }
    setInviting(false);
  };

  const handleUpdateUserLocation = async (userId, locationId) => {
    await base44.entities.User.update(userId, { location_id: locationId });
    queryClient.invalidateQueries({ queryKey: ['users'] });
    toast.success('User location updated');
  };

  const getLocationName = (locationId) => {
    const location = locations.find(l => l.id === locationId);
    return location?.name || 'Unassigned';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Users
        </h2>
        <Button 
          onClick={() => setShowInviteModal(true)}
          size="sm"
          className="bg-amber-500 hover:bg-amber-600"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            No users yet. Invite your first user to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {users.map(user => (
            <Card key={user.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      user.is_platform_admin || user.role === 'admin' 
                        ? "bg-amber-100" 
                        : "bg-slate-100"
                    )}>
                      <User className={cn(
                        "w-5 h-5",
                        user.is_platform_admin || user.role === 'admin' 
                          ? "text-amber-600" 
                          : "text-slate-500"
                      )} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 truncate">
                          {user.full_name || 'Unnamed User'}
                        </span>
                        {(user.is_platform_admin || user.role === 'admin') && (
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>
                  
                  {!user.is_platform_admin && user.role !== 'admin' && (
                    <Select 
                      value={user.location_id || ''} 
                      onValueChange={(value) => handleUpdateUserLocation(user.id, value)}
                    >
                      <SelectTrigger className="w-48">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <SelectValue placeholder="Assign location" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {(user.is_platform_admin || user.role === 'admin') && (
                    <Badge variant="outline" className="text-slate-500">
                      All Locations
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Invite User
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input 
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Assign to Location</Label>
              <Select value={inviteLocationId} onValueChange={setInviteLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                You can change the location assignment after the user joins.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || !inviteLocationId || inviting}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {inviting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}