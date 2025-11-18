import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetAssetUnitsByItemId, useAddAssetUnit, useUpdateAssetUnit, useDeleteAssetUnit } from '../hooks/useQueries';
import { EquipmentStatus, EquipmentLocation, type CatalogItem, type AssetUnit } from '../backend';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface AssetUnitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogItem: CatalogItem | null;
}

export default function AssetUnitsDialog({ open, onOpenChange, catalogItem }: AssetUnitsDialogProps) {
  const { data: assetUnits = [] } = useGetAssetUnitsByItemId(catalogItem?.item_id || null);
  const addAssetUnit = useAddAssetUnit();
  const updateAssetUnit = useUpdateAssetUnit();
  const deleteAssetUnit = useDeleteAssetUnit();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<AssetUnit | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<AssetUnit | null>(null);

  const [formData, setFormData] = useState({
    asset_tag: '',
    office_location: EquipmentLocation.dallas,
    status: EquipmentStatus.available,
  });

  useEffect(() => {
    if (editingUnit) {
      setFormData({
        asset_tag: editingUnit.asset_tag,
        office_location: editingUnit.office_location,
        status: editingUnit.status,
      });
      setShowAddForm(true);
    } else {
      setFormData({
        asset_tag: '',
        office_location: EquipmentLocation.dallas,
        status: EquipmentStatus.available,
      });
    }
  }, [editingUnit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogItem) return;

    const unitData = {
      item_id: catalogItem.item_id,
      asset_tag: formData.asset_tag,
      office_location: formData.office_location,
      status: formData.status,
    };

    if (editingUnit) {
      await updateAssetUnit.mutateAsync({
        id: editingUnit.asset_unit_id,
        unit: { ...unitData, asset_unit_id: editingUnit.asset_unit_id },
      });
    } else {
      await addAssetUnit.mutateAsync(unitData);
    }

    setShowAddForm(false);
    setEditingUnit(null);
    setFormData({
      asset_tag: '',
      office_location: EquipmentLocation.dallas,
      status: EquipmentStatus.available,
    });
  };

  const handleEdit = (unit: AssetUnit) => {
    setEditingUnit(unit);
  };

  const handleDelete = (unit: AssetUnit) => {
    setUnitToDelete(unit);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (unitToDelete) {
      await deleteAssetUnit.mutateAsync(unitToDelete.asset_unit_id);
      setDeleteDialogOpen(false);
      setUnitToDelete(null);
    }
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingUnit(null);
    setFormData({
      asset_tag: '',
      office_location: EquipmentLocation.dallas,
      status: EquipmentStatus.available,
    });
  };

  const getStatusBadge = (status: EquipmentStatus) => {
    const config = {
      [EquipmentStatus.available]: { variant: 'default' as const, label: 'Available' },
      [EquipmentStatus.rented]: { variant: 'secondary' as const, label: 'Rented' },
      [EquipmentStatus.maintenance]: { variant: 'destructive' as const, label: 'Maintenance' },
    };
    const { variant, label } = config[status];
    return <Badge variant={variant} className="text-xs">{label}</Badge>;
  };

  const getLocationLabel = (location: EquipmentLocation) => {
    const locationMap: Record<EquipmentLocation, string> = {
      [EquipmentLocation.dallas]: 'Dallas',
      [EquipmentLocation.miami]: 'Miami',
      [EquipmentLocation.phoenix]: 'Phoenix',
      [EquipmentLocation.minneapolis]: 'Minneapolis',
    };
    return locationMap[location];
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Asset Units</DialogTitle>
            <DialogDescription>
              {catalogItem?.name} - {assetUnits.length} unit{assetUnits.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Asset Unit
              </Button>
            )}

            {showAddForm && (
              <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <h4 className="font-semibold text-sm">{editingUnit ? 'Edit Asset Unit' : 'Add New Asset Unit'}</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="asset_tag">Asset Tag *</Label>
                  <Input
                    id="asset_tag"
                    placeholder="e.g., PT-001, MIC-SM58-01"
                    value={formData.asset_tag}
                    onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="office_location">Office Location *</Label>
                  <Select value={formData.office_location} onValueChange={(value) => setFormData({ ...formData, office_location: value as EquipmentLocation })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EquipmentLocation.dallas}>Dallas</SelectItem>
                      <SelectItem value={EquipmentLocation.miami}>Miami</SelectItem>
                      <SelectItem value={EquipmentLocation.phoenix}>Phoenix</SelectItem>
                      <SelectItem value={EquipmentLocation.minneapolis}>Minneapolis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as EquipmentStatus })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EquipmentStatus.available}>Available</SelectItem>
                      <SelectItem value={EquipmentStatus.rented}>Rented</SelectItem>
                      <SelectItem value={EquipmentStatus.maintenance}>Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={cancelForm} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addAssetUnit.isPending || updateAssetUnit.isPending} className="flex-1">
                    {addAssetUnit.isPending || updateAssetUnit.isPending ? 'Saving...' : editingUnit ? 'Update' : 'Add'}
                  </Button>
                </div>
              </form>
            )}

            <div className="flex-1 overflow-hidden">
              <h4 className="text-sm font-semibold mb-2">Existing Asset Units:</h4>
              {assetUnits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No asset units yet. Add one to get started.</p>
              ) : (
                <ScrollArea className="h-[300px] border rounded-lg">
                  <div className="p-4 space-y-2">
                    {assetUnits.map((unit) => (
                      <div key={Number(unit.asset_unit_id)} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-medium">{unit.asset_tag}</span>
                            {getStatusBadge(unit.status)}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{getLocationLabel(unit.office_location)}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(unit)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(unit)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset Unit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete asset unit "{unitToDelete?.asset_tag}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
