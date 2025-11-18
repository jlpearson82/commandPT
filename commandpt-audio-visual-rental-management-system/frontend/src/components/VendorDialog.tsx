import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddVendor, useUpdateVendor } from '../hooks/useQueries';
import { VendorCategory, type Vendor } from '../backend';

interface VendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: Vendor | null;
}

export default function VendorDialog({ open, onOpenChange, vendor }: VendorDialogProps) {
  const [name, setName] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [vendorCategory, setVendorCategory] = useState<VendorCategory>(VendorCategory.equipment);

  const addVendor = useAddVendor();
  const updateVendor = useUpdateVendor();

  useEffect(() => {
    if (vendor) {
      setName(vendor.name);
      setPrimaryContactName(vendor.primaryContactName);
      setEmail(vendor.email);
      setPhoneNumber(vendor.phoneNumber);
      setAddress(vendor.address || '');
      setNotes(vendor.notes || '');
      setVendorCategory(vendor.vendor_category);
    } else {
      setName('');
      setPrimaryContactName('');
      setEmail('');
      setPhoneNumber('');
      setAddress('');
      setNotes('');
      setVendorCategory(VendorCategory.equipment);
    }
  }, [vendor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const vendorData = {
      name,
      primaryContactName,
      email,
      phoneNumber,
      address: address || undefined,
      notes: notes || undefined,
      vendor_category: vendorCategory,
    };

    if (vendor) {
      await updateVendor.mutateAsync({
        id: vendor.id,
        vendor: { ...vendorData, id: vendor.id },
      });
    } else {
      await addVendor.mutateAsync(vendorData);
    }

    onOpenChange(false);
  };

  const getCategoryLabel = (category: VendorCategory) => {
    const categoryMap: Record<VendorCategory, string> = {
      [VendorCategory.equipment]: 'Equipment',
      [VendorCategory.labor]: 'Labor',
      [VendorCategory.laborAndEquipment]: 'Labor and Equipment',
      [VendorCategory.transportation]: 'Transportation',
      [VendorCategory.miscellaneous]: 'Miscellaneous',
    };
    return categoryMap[category];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{vendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Vendor Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter vendor name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryContactName">Primary Contact *</Label>
              <Input
                id="primaryContactName"
                value={primaryContactName}
                onChange={(e) => setPrimaryContactName(e.target.value)}
                placeholder="Enter contact name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="(555) 123-4567"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorCategory">Vendor Category *</Label>
            <Select value={vendorCategory} onValueChange={(value) => setVendorCategory(value as VendorCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={VendorCategory.equipment}>{getCategoryLabel(VendorCategory.equipment)}</SelectItem>
                <SelectItem value={VendorCategory.labor}>{getCategoryLabel(VendorCategory.labor)}</SelectItem>
                <SelectItem value={VendorCategory.laborAndEquipment}>{getCategoryLabel(VendorCategory.laborAndEquipment)}</SelectItem>
                <SelectItem value={VendorCategory.transportation}>{getCategoryLabel(VendorCategory.transportation)}</SelectItem>
                <SelectItem value={VendorCategory.miscellaneous}>{getCategoryLabel(VendorCategory.miscellaneous)}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address (Optional)</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter vendor address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this vendor..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addVendor.isPending || updateVendor.isPending}>
              {addVendor.isPending || updateVendor.isPending ? 'Saving...' : vendor ? 'Update Vendor' : 'Add Vendor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
