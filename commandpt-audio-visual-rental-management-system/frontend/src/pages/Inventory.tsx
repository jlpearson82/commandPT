import { useState } from 'react';
import { useGetAllCatalogItems, useGetAllAssetUnits, useDeleteCatalogItem, useIsAdmin, useClearInventoryData, useDownloadCsvTemplate } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Package, Upload, FileDown, MapPin, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { EquipmentStatus, EquipmentLocation, Category, type CatalogItem, type AssetUnit } from '../backend';
import CatalogItemDialog from '../components/CatalogItemDialog';
import AssetUnitsDialog from '../components/AssetUnitsDialog';
import CsvImportDialog from '../components/CsvImportDialog';
import PreloadedCsvImportDialog from '../components/PreloadedCsvImportDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function Inventory() {
  const { data: catalogItems = [], isLoading: catalogLoading } = useGetAllCatalogItems();
  const { data: assetUnits = [], isLoading: assetsLoading } = useGetAllAssetUnits();
  const { data: isAdmin = false } = useIsAdmin();
  const deleteCatalogItem = useDeleteCatalogItem();
  const clearInventoryData = useClearInventoryData();
  const downloadCsvTemplate = useDownloadCsvTemplate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);
  const [assetsDialogOpen, setAssetsDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [preloadedCsvDialogOpen, setPreloadedCsvDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [selectedItemForAssets, setSelectedItemForAssets] = useState<CatalogItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const categories = [
    Category.lighting,
    Category.audio,
    Category.video,
    Category.cable,
    Category.drape,
    Category.miscellaneous,
  ];

  const getCategoryLabel = (category: Category) => {
    const categoryMap: Record<Category, string> = {
      [Category.lighting]: 'Lighting',
      [Category.audio]: 'Audio',
      [Category.video]: 'Video',
      [Category.cable]: 'Cable',
      [Category.drape]: 'Drape',
      [Category.miscellaneous]: 'Miscellaneous',
    };
    return categoryMap[category];
  };

  const getAssetUnitsForItem = (itemId: bigint) => {
    return assetUnits.filter((unit) => unit.item_id === itemId);
  };

  const filteredCatalogItems = catalogItems.filter((item) => {
    const itemAssets = getAssetUnitsForItem(item.item_id);
    
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCategoryLabel(item.category).toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemAssets.some(asset => asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    const matchesLocation = locationFilter === 'all' || 
      itemAssets.some(asset => asset.office_location === locationFilter);
    
    const matchesStatus = statusFilter === 'all' || 
      itemAssets.some(asset => asset.status === statusFilter);
    
    return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
  });

  const handleEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setCatalogDialogOpen(true);
  };

  const handleManageAssets = (item: CatalogItem) => {
    setSelectedItemForAssets(item);
    setAssetsDialogOpen(true);
  };

  const handleDelete = (item: CatalogItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteCatalogItem.mutateAsync(itemToDelete.item_id);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleClearInventory = async () => {
    await clearInventoryData.mutateAsync();
    setClearDialogOpen(false);
  };

  const handleDownloadTemplate = async () => {
    await downloadCsvTemplate.mutateAsync();
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
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

  const getStatusCounts = (itemAssets: AssetUnit[]) => {
    const available = itemAssets.filter(a => a.status === EquipmentStatus.available).length;
    const rented = itemAssets.filter(a => a.status === EquipmentStatus.rented).length;
    const maintenance = itemAssets.filter(a => a.status === EquipmentStatus.maintenance).length;
    return { available, rented, maintenance, total: itemAssets.length };
  };

  if (catalogLoading || assetsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipment Inventory</h1>
          <p className="text-muted-foreground mt-1">
            {catalogItems.length} catalog items • {assetUnits.length} total units
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleDownloadTemplate} disabled={downloadCsvTemplate.isPending}>
              <Download className="h-4 w-4 mr-2" />
              {downloadCsvTemplate.isPending ? 'Downloading...' : 'Download CSV Template'}
            </Button>
            <Button variant="outline" onClick={() => setPreloadedCsvDialogOpen(true)}>
              <FileDown className="h-4 w-4 mr-2" />
              Import Asset Listing
            </Button>
            <Button variant="outline" onClick={() => setCsvDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="destructive" onClick={() => setClearDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Inventory
            </Button>
            <Button onClick={() => { setEditingItem(null); setCatalogDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Catalog Item
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items or asset tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{getCategoryLabel(cat)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value={EquipmentLocation.dallas}>Dallas</SelectItem>
                <SelectItem value={EquipmentLocation.miami}>Miami</SelectItem>
                <SelectItem value={EquipmentLocation.phoenix}>Phoenix</SelectItem>
                <SelectItem value={EquipmentLocation.minneapolis}>Minneapolis</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={EquipmentStatus.available}>Available</SelectItem>
                <SelectItem value={EquipmentStatus.rented}>Rented</SelectItem>
                <SelectItem value={EquipmentStatus.maintenance}>Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredCatalogItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No equipment found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {searchTerm || categoryFilter !== 'all' || locationFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first catalog item'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCatalogItems.map((item) => {
            const itemAssets = getAssetUnitsForItem(item.item_id);
            const statusCounts = getStatusCounts(itemAssets);
            const isExpanded = expandedItems.has(String(item.item_id));

            return (
              <Card key={Number(item.item_id)} className="hover:shadow-md transition-shadow">
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(String(item.item_id))}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 mt-1">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        {item.item_photo && (
                          <img 
                            src={item.item_photo.getDirectURL()} 
                            alt={item.name} 
                            className="h-16 w-16 object-cover rounded border"
                          />
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{getCategoryLabel(item.category)}</Badge>
                            <span className="text-sm font-medium text-primary">${(Number(item.price) / 100).toFixed(2)}/day</span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-sm font-medium">
                          {statusCounts.total} unit{statusCounts.total !== 1 ? 's' : ''}
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span className="text-green-600">{statusCounts.available} avail</span>
                          <span className="text-blue-600">{statusCounts.rented} rented</span>
                          <span className="text-orange-600">{statusCounts.maintenance} maint</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="ml-8 space-y-3">
                        <div className="border-t pt-3">
                          <h4 className="text-sm font-semibold mb-2">Asset Units:</h4>
                          {itemAssets.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No asset units yet</p>
                          ) : (
                            <div className="space-y-2">
                              {itemAssets.map((asset) => (
                                <div key={Number(asset.asset_unit_id)} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs">{asset.asset_tag}</span>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <span className="text-xs">{getLocationLabel(asset.office_location)}</span>
                                    </div>
                                  </div>
                                  {getStatusBadge(asset.status)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {isAdmin && (
                          <div className="flex gap-2 pt-2 border-t">
                            <Button variant="outline" size="sm" onClick={() => handleManageAssets(item)}>
                              <Package className="h-3 w-3 mr-1" />
                              Manage Units
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit Item
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(item)}>
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      <CatalogItemDialog
        open={catalogDialogOpen}
        onOpenChange={setCatalogDialogOpen}
        editingItem={editingItem}
      />

      <AssetUnitsDialog
        open={assetsDialogOpen}
        onOpenChange={setAssetsDialogOpen}
        catalogItem={selectedItemForAssets}
      />

      <CsvImportDialog
        open={csvDialogOpen}
        onOpenChange={setCsvDialogOpen}
      />

      <PreloadedCsvImportDialog
        open={preloadedCsvDialogOpen}
        onOpenChange={setPreloadedCsvDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Catalog Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This will also delete all associated asset units. This action cannot be undone.
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

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Inventory Data</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all inventory data? This will permanently delete all catalog items and asset units. Quotes, clients, venues, and other data will not be affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearInventory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {clearInventoryData.isPending ? 'Clearing...' : 'Clear All Inventory'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
