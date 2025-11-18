import { useState } from 'react';
import { useGetAllVendors, useAddVendor, useUpdateVendor, useDeleteVendor } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Building2, Pencil, Trash2 } from 'lucide-react';
import VendorDialog from '../components/VendorDialog';
import { VendorCategory, type Vendor } from '../backend';

export default function Vendors() {
  const { data: vendors = [], isLoading } = useGetAllVendors();
  const deleteVendor = useDeleteVendor();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const filteredVendors = vendors.filter((vendor) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      vendor.name.toLowerCase().includes(searchLower) ||
      vendor.primaryContactName.toLowerCase().includes(searchLower) ||
      vendor.email.toLowerCase().includes(searchLower)
    );
  });

  const handleAddVendor = () => {
    setEditingVendor(null);
    setDialogOpen(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setDialogOpen(true);
  };

  const handleDeleteVendor = async (id: bigint) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      await deleteVendor.mutateAsync(id);
    }
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

  const getCategoryVariant = (category: VendorCategory) => {
    const variantMap: Record<VendorCategory, 'default' | 'secondary' | 'outline'> = {
      [VendorCategory.equipment]: 'default',
      [VendorCategory.labor]: 'secondary',
      [VendorCategory.laborAndEquipment]: 'outline',
      [VendorCategory.transportation]: 'outline',
      [VendorCategory.miscellaneous]: 'outline',
    };
    return variantMap[category];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Vendors</h1>
          <p className="text-muted-foreground mt-1">Manage vendor contacts and information</p>
        </div>
        <img src="/assets/generated/vendors-icon-transparent.dim_64x64.png" alt="Vendors" className="h-16 w-16 opacity-80" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vendors by name, contact, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleAddVendor}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredVendors.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No vendors found matching your search' : 'No vendors yet. Add your first vendor to get started.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredVendors.map((vendor) => (
                <Card key={vendor.id.toString()} className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-lg truncate">{vendor.name}</CardTitle>
                          <p className="text-sm text-muted-foreground truncate">{vendor.primaryContactName}</p>
                        </div>
                      </div>
                    </div>
                    <Badge variant={getCategoryVariant(vendor.vendor_category)} className="mt-2 w-fit">
                      {getCategoryLabel(vendor.vendor_category)}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground truncate">Email: {vendor.email}</p>
                      <p className="text-muted-foreground">Phone: {vendor.phoneNumber}</p>
                      {vendor.address && <p className="text-muted-foreground truncate">Address: {vendor.address}</p>}
                      {vendor.notes && (
                        <p className="text-muted-foreground mt-2 pt-2 border-t line-clamp-2">
                          <span className="font-medium">Notes:</span> {vendor.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditVendor(vendor)} className="flex-1">
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteVendor(vendor.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <VendorDialog open={dialogOpen} onOpenChange={setDialogOpen} vendor={editingVendor} />
    </div>
  );
}
