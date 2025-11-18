import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAddVenue, useUpdateVenue } from '../hooks/useQueries';
import type { Venue } from '../backend';

interface VenueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingVenue: Venue | null;
}

export default function VenueDialog({ open, onOpenChange, editingVenue }: VenueDialogProps) {
  const addVenue = useAddVenue();
  const updateVenue = useUpdateVenue();

  const [formData, setFormData] = useState({
    venue_name: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    phone: '',
    website: '',
    notes: '',
  });

  useEffect(() => {
    if (editingVenue) {
      setFormData({
        venue_name: editingVenue.venue_name,
        address_line_1: editingVenue.address_line_1,
        address_line_2: editingVenue.address_line_2,
        city: editingVenue.city,
        state: editingVenue.state,
        postal_code: editingVenue.postal_code,
        country: editingVenue.country,
        phone: editingVenue.phone || '',
        website: editingVenue.website || '',
        notes: editingVenue.notes || '',
      });
    } else {
      setFormData({
        venue_name: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US',
        phone: '',
        website: '',
        notes: '',
      });
    }
  }, [editingVenue, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const venueData = {
      venue_name: formData.venue_name,
      address_line_1: formData.address_line_1,
      address_line_2: formData.address_line_2,
      city: formData.city,
      state: formData.state,
      postal_code: formData.postal_code,
      country: formData.country,
      phone: formData.phone || undefined,
      website: formData.website || undefined,
      notes: formData.notes || undefined,
    };

    if (editingVenue) {
      await updateVenue.mutateAsync({
        id: editingVenue.venue_id,
        venue: { ...venueData, venue_id: editingVenue.venue_id },
      });
    } else {
      await addVenue.mutateAsync(venueData);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingVenue ? 'Edit Venue' : 'Add New Venue'}</DialogTitle>
          <DialogDescription>
            {editingVenue ? 'Update venue information' : 'Enter venue details for delivery locations'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="venue_name">Venue Name *</Label>
            <Input
              id="venue_name"
              value={formData.venue_name}
              onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
              placeholder="e.g., Convention Center"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address_line_1">Address Line 1 *</Label>
              <Input
                id="address_line_1"
                value={formData.address_line_1}
                onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                placeholder="Street address"
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address_line_2">Address Line 2</Label>
              <Input
                id="address_line_2"
                value={formData.address_line_2}
                onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
                placeholder="Suite, unit, building, floor, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code *</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="ZIP code"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Country"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional information about this venue..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={addVenue.isPending || updateVenue.isPending} className="flex-1">
              {addVenue.isPending || updateVenue.isPending ? 'Saving...' : editingVenue ? 'Update' : 'Add Venue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
