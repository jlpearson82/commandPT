import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddClient, useUpdateClient } from '../hooks/useQueries';
import { type Client } from '../backend';

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingClient: Client | null;
}

export default function ClientDialog({ open, onOpenChange, editingClient }: ClientDialogProps) {
  const addClient = useAddClient();
  const updateClient = useUpdateClient();

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.name,
        company: editingClient.company,
        phone: editingClient.phone,
        email: editingClient.email,
      });
    } else {
      setFormData({
        name: '',
        company: '',
        phone: '',
        email: '',
      });
    }
  }, [editingClient, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingClient) {
      await updateClient.mutateAsync({
        id: editingClient.id,
        client: { ...formData, id: editingClient.id },
      });
    } else {
      await addClient.mutateAsync(formData);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingClient ? 'Edit Client' : 'Add Client'}</DialogTitle>
          <DialogDescription>
            {editingClient ? 'Update client information' : 'Add a new client to your database'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Client Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="Acme Corporation"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={addClient.isPending || updateClient.isPending} className="flex-1">
              {addClient.isPending || updateClient.isPending ? 'Saving...' : editingClient ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
