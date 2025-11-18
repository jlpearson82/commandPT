import { useState } from 'react';
import { useGetConfirmedQuotes, useGetAllClients, useGetAllVenues, useGetAllVendors, useGetCostsByJobId, useAddCost, useUpdateCost, useDeleteCost } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Download, Plus, Trash2, Edit2, Calendar, MapPin } from 'lucide-react';
import { VendorCategory, type Cost } from '../backend';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function Costs() {
  const { data: quotes = [], isLoading: quotesLoading } = useGetConfirmedQuotes();
  const { data: clients = [] } = useGetAllClients();
  const { data: venues = [] } = useGetAllVenues();
  const { data: vendors = [] } = useGetAllVendors();
  
  const [selectedJobId, setSelectedJobId] = useState<bigint | null>(null);
  const { data: costs = [], isLoading: costsLoading } = useGetCostsByJobId(selectedJobId);
  
  const addCost = useAddCost();
  const updateCost = useUpdateCost();
  const deleteCost = useDeleteCost();

  const [editingCost, setEditingCost] = useState<Cost | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [costToDelete, setCostToDelete] = useState<Cost | null>(null);

  const [formData, setFormData] = useState({
    vendorId: '',
    vendorCategory: '',
    projectedCost: '',
    actualCost: '',
    notes: '',
  });

  const selectedQuote = quotes.find(q => q.id === selectedJobId);
  const selectedClient = selectedQuote ? clients.find(c => c.id === selectedQuote.clientId) : null;
  const selectedVenue = selectedQuote?.venue_id ? venues.find(v => v.venue_id === selectedQuote.venue_id) : null;

  const formatDateRange = (startDate: string, endDate?: string) => {
    if (!endDate || startDate === endDate) {
      return new Date(startDate).toLocaleDateString();
    }
    return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const totalProjectedCosts = costs.reduce((sum, cost) => sum + Number(cost.projected_cost), 0);
  const totalActualCosts = costs.reduce((sum, cost) => sum + Number(cost.actual_cost), 0);

  const quoteTotal = selectedQuote ? Number(selectedQuote.totalCents) : 0;
  const projectedProfit = quoteTotal - totalProjectedCosts;
  const actualProfit = quoteTotal - totalActualCosts;
  const projectedMargin = quoteTotal > 0 ? (projectedProfit / quoteTotal) * 100 : 0;
  const actualMargin = quoteTotal > 0 ? (actualProfit / quoteTotal) * 100 : 0;

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(BigInt(jobId));
    setFormData({
      vendorId: '',
      vendorCategory: '',
      projectedCost: '',
      actualCost: '',
      notes: '',
    });
    setEditingCost(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedJobId || !formData.vendorId || !formData.vendorCategory || !formData.projectedCost) {
      toast.error('Please fill in all required fields');
      return;
    }

    const projectedCostCents = Math.round(parseFloat(formData.projectedCost) * 100);
    const actualCostCents = formData.actualCost ? Math.round(parseFloat(formData.actualCost) * 100) : 0;

    const costData: Cost = {
      cost_id: editingCost?.cost_id || 0n,
      job_id: selectedJobId,
      vendor_id: BigInt(formData.vendorId),
      vendor_category: formData.vendorCategory as VendorCategory,
      projected_cost: BigInt(projectedCostCents),
      actual_cost: BigInt(actualCostCents),
      notes: formData.notes || undefined,
    };

    try {
      if (editingCost) {
        await updateCost.mutateAsync({ id: editingCost.cost_id, cost: costData });
      } else {
        await addCost.mutateAsync(costData);
      }
      
      setFormData({
        vendorId: '',
        vendorCategory: '',
        projectedCost: '',
        actualCost: '',
        notes: '',
      });
      setEditingCost(null);
    } catch (error) {
      console.error('Error saving cost:', error);
    }
  };

  const handleEdit = (cost: Cost) => {
    setEditingCost(cost);
    setFormData({
      vendorId: cost.vendor_id.toString(),
      vendorCategory: cost.vendor_category,
      projectedCost: (Number(cost.projected_cost) / 100).toFixed(2),
      actualCost: (Number(cost.actual_cost) / 100).toFixed(2),
      notes: cost.notes || '',
    });
  };

  const handleDelete = (cost: Cost) => {
    setCostToDelete(cost);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (costToDelete) {
      await deleteCost.mutateAsync(costToDelete.cost_id);
      setDeleteDialogOpen(false);
      setCostToDelete(null);
    }
  };

  const handleDownloadCSV = () => {
    if (!selectedQuote || costs.length === 0) {
      toast.error('No costs to export');
      return;
    }

    const headers = ['Job ID', 'Job Name', 'Client', 'Event Dates', 'Vendor Name', 'Vendor Category', 'Projected Cost', 'Actual Cost', 'Notes'];
    const rows = costs.map(cost => {
      const vendor = vendors.find(v => v.id === cost.vendor_id);
      return [
        selectedQuote.referenceNumber,
        selectedQuote.referenceNumber,
        selectedClient?.name || 'Unknown',
        formatDateRange(selectedQuote.event_start_date, selectedQuote.event_end_date),
        vendor?.name || 'Unknown',
        cost.vendor_category,
        (Number(cost.projected_cost) / 100).toFixed(2),
        (Number(cost.actual_cost) / 100).toFixed(2),
        cost.notes || '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `costs-${selectedQuote.referenceNumber}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('Costs exported successfully');
  };

  const getVendorCategoryLabel = (category: VendorCategory) => {
    const labels: Record<VendorCategory, string> = {
      [VendorCategory.equipment]: 'Equipment',
      [VendorCategory.labor]: 'Labor',
      [VendorCategory.laborAndEquipment]: 'Labor & Equipment',
      [VendorCategory.transportation]: 'Transportation',
      [VendorCategory.miscellaneous]: 'Miscellaneous',
    };
    return labels[category];
  };

  if (quotesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Costs</h1>
          <p className="text-muted-foreground mt-1">Track job costs and calculate profit margins</p>
        </div>
        <img src="/assets/generated/costs-icon-transparent.dim_64x64.png" alt="Costs" className="h-16 w-16 opacity-80" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Job</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedJobId?.toString() || ''} onValueChange={handleJobSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a job..." />
            </SelectTrigger>
            <SelectContent>
              {quotes.map(quote => {
                const client = clients.find(c => c.id === quote.clientId);
                const venue = quote.venue_id ? venues.find(v => v.venue_id === quote.venue_id) : null;
                return (
                  <SelectItem key={quote.id.toString()} value={quote.id.toString()}>
                    {quote.referenceNumber} - {client?.name || 'Unknown'} - {venue?.venue_name || 'No venue'}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedJobId && selectedQuote && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Job Number</p>
                  <p className="font-semibold">{selectedQuote.referenceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-semibold">{selectedClient?.name || 'Unknown'}</p>
                </div>
                {selectedVenue && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Delivery Location
                    </p>
                    <p className="font-semibold">{selectedVenue.venue_name}, {selectedVenue.city}, {selectedVenue.state}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Event Dates
                  </p>
                  <p className="font-semibold">{formatDateRange(selectedQuote.event_start_date, selectedQuote.event_end_date)}</p>
                </div>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Quote Total</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(quoteTotal)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Projected Profit / Margin</p>
                    {quoteTotal > 0 ? (
                      <p className="text-lg font-semibold">
                        {formatCurrency(projectedProfit)} / {projectedMargin.toFixed(2)}%
                      </p>
                    ) : (
                      <p className="text-lg font-semibold text-muted-foreground">N/A</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Actual Profit / Margin</p>
                    {quoteTotal > 0 ? (
                      <p className="text-lg font-semibold">
                        {formatCurrency(actualProfit)} / {actualMargin.toFixed(2)}%
                      </p>
                    ) : (
                      <p className="text-lg font-semibold text-muted-foreground">N/A</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{editingCost ? 'Edit Cost Entry' : 'Add Cost Entry'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor *</Label>
                    <Select value={formData.vendorId} onValueChange={(value) => setFormData({ ...formData, vendorId: value })}>
                      <SelectTrigger id="vendor">
                        <SelectValue placeholder="Select vendor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map(vendor => (
                          <SelectItem key={vendor.id.toString()} value={vendor.id.toString()}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Vendor Category *</Label>
                    <Select value={formData.vendorCategory} onValueChange={(value) => setFormData({ ...formData, vendorCategory: value })}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={VendorCategory.equipment}>Equipment</SelectItem>
                        <SelectItem value={VendorCategory.labor}>Labor</SelectItem>
                        <SelectItem value={VendorCategory.laborAndEquipment}>Labor & Equipment</SelectItem>
                        <SelectItem value={VendorCategory.transportation}>Transportation</SelectItem>
                        <SelectItem value={VendorCategory.miscellaneous}>Miscellaneous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projected">Projected Cost * ($)</Label>
                    <Input
                      id="projected"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.projectedCost}
                      onChange={(e) => setFormData({ ...formData, projectedCost: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="actual">Actual Cost ($)</Label>
                    <Input
                      id="actual"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.actualCost}
                      onChange={(e) => setFormData({ ...formData, actualCost: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Optional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={addCost.isPending || updateCost.isPending}>
                    {addCost.isPending || updateCost.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        {editingCost ? 'Update Cost' : 'Add Cost'}
                      </>
                    )}
                  </Button>
                  {editingCost && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingCost(null);
                        setFormData({
                          vendorId: '',
                          vendorCategory: '',
                          projectedCost: '',
                          actualCost: '',
                          notes: '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Cost Entries</CardTitle>
                {costs.length > 0 && (
                  <Button onClick={handleDownloadCSV} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Costs for Accounting
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {costsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                    <p className="text-muted-foreground">Loading costs...</p>
                  </div>
                </div>
              ) : costs.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No costs added yet</p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Projected Cost</TableHead>
                          <TableHead className="text-right">Actual Cost</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costs.map(cost => {
                          const vendor = vendors.find(v => v.id === cost.vendor_id);
                          return (
                            <TableRow key={cost.cost_id.toString()}>
                              <TableCell className="font-medium">{vendor?.name || 'Unknown'}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{getVendorCategoryLabel(cost.vendor_category)}</Badge>
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(Number(cost.projected_cost))}</TableCell>
                              <TableCell className="text-right">{formatCurrency(Number(cost.actual_cost))}</TableCell>
                              <TableCell className="max-w-xs truncate">{cost.notes || '-'}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(cost)}>
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDelete(cost)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-4 border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Projected Costs</p>
                        <p className="text-2xl font-bold">{formatCurrency(totalProjectedCosts)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Actual Costs</p>
                        <p className="text-2xl font-bold">{formatCurrency(totalActualCosts)}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cost Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this cost entry? This action cannot be undone.
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
    </div>
  );
}
