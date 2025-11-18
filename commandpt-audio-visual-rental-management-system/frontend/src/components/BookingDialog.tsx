import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddBooking, useGetAllClients, useGetAllCatalogItems } from '../hooks/useQueries';

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BookingDialog({ open, onOpenChange }: BookingDialogProps) {
  const addBooking = useAddBooking();
  const { data: clients = [] } = useGetAllClients();
  const { data: catalogItems = [] } = useGetAllCatalogItems();

  const [formData, setFormData] = useState({
    equipmentId: '',
    clientId: '',
    startDate: '',
    endDate: '',
    status: 'confirmed',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await addBooking.mutateAsync({
      equipmentId: BigInt(formData.equipmentId),
      clientId: BigInt(formData.clientId),
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status,
    });

    setFormData({
      equipmentId: '',
      clientId: '',
      startDate: '',
      endDate: '',
      status: 'confirmed',
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Booking</DialogTitle>
          <DialogDescription>Schedule equipment rental for a client</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="equipment">Equipment</Label>
            <Select value={formData.equipmentId} onValueChange={(value) => setFormData({ ...formData, equipmentId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {catalogItems.map((item) => (
                  <SelectItem key={Number(item.item_id)} value={String(item.item_id)}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={Number(client.id)} value={String(client.id)}>
                    {client.name} - {client.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Input
              id="status"
              placeholder="e.g., confirmed, pending"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={addBooking.isPending} className="flex-1">
              {addBooking.isPending ? 'Adding...' : 'Add Booking'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
