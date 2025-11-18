import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateQuote, useUpdateQuote, useGetAllClients, useGetAllCatalogItems, useGetAllVenues } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Principal } from '@dfinity/principal';
import { QuoteStatus, Category, EquipmentLocation, type Quote, type QuoteItem, type QuoteSection } from '../backend';
import { Plus, Trash2, Copy, Edit2, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import VenueDialog from './VenueDialog';

interface QuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingQuote: Quote | null;
}

interface QuoteItemForm {
  equipmentId: string;
  quantity: string;
  pricePerDay: string;
  numberOfDays: string;
  description: string;
  isCustomItem: boolean;
  customName: string;
  customCategory: string;
}

interface QuoteSectionForm {
  name: string;
  items: QuoteItemForm[];
  taxEnabled: boolean;
  taxRate: string;
}

export default function QuoteDialog({ open, onOpenChange, editingQuote }: QuoteDialogProps) {
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const { data: clients = [] } = useGetAllClients();
  const { data: catalogItems = [] } = useGetAllCatalogItems();
  const { data: venues = [] } = useGetAllVenues();
  const { identity } = useInternetIdentity();

  const [formData, setFormData] = useState({
    clientId: '',
    venueId: '',
    eventStartDate: '',
    eventEndDate: '',
    referenceNumber: '',
    status: QuoteStatus.draft,
    office: EquipmentLocation.dallas,
  });

  const [sections, setSections] = useState<QuoteSectionForm[]>([
    {
      name: 'Main Section',
      items: [{ equipmentId: '', quantity: '1', pricePerDay: '0.00', numberOfDays: '1', description: '', isCustomItem: false, customName: '', customCategory: '' }],
      taxEnabled: false,
      taxRate: '10',
    },
  ]);

  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');
  const [venueDialogOpen, setVenueDialogOpen] = useState(false);
  const [venueSearchTerm, setVenueSearchTerm] = useState('');
  const [equipmentSearchTerms, setEquipmentSearchTerms] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingQuote) {
      setFormData({
        clientId: String(editingQuote.clientId),
        venueId: editingQuote.venue_id ? String(editingQuote.venue_id) : '',
        eventStartDate: editingQuote.event_start_date,
        eventEndDate: editingQuote.event_end_date || '',
        referenceNumber: editingQuote.referenceNumber,
        status: editingQuote.status,
        office: editingQuote.office,
      });
      
      setSections(
        editingQuote.sections.map((section) => ({
          name: section.name,
          items: section.items.map((item) => ({
            equipmentId: item.equipmentId !== undefined ? String(item.equipmentId) : '',
            quantity: String(item.quantity),
            pricePerDay: (Number(item.pricePerDayCents) / 100).toFixed(2),
            numberOfDays: String(item.numberOfDays),
            description: item.description || '',
            isCustomItem: item.isCustom,
            customName: item.customName || '',
            customCategory: item.customCategory || '',
          })),
          taxEnabled: section.tax_enabled,
          taxRate: String(Number(section.tax_rate)),
        }))
      );
    } else {
      setFormData({
        clientId: '',
        venueId: '',
        eventStartDate: '',
        eventEndDate: '',
        referenceNumber: `QT-${Date.now()}`,
        status: QuoteStatus.draft,
        office: EquipmentLocation.dallas,
      });
      setSections([
        {
          name: 'Main Section',
          items: [{ equipmentId: '', quantity: '1', pricePerDay: '0.00', numberOfDays: '1', description: '', isCustomItem: false, customName: '', customCategory: '' }],
          taxEnabled: false,
          taxRate: '10',
        },
      ]);
    }
    setEquipmentSearchTerms({});
  }, [editingQuote, open]);

  const addSection = () => {
    setSections([
      ...sections,
      {
        name: `Section ${sections.length + 1}`,
        items: [{ equipmentId: '', quantity: '1', pricePerDay: '0.00', numberOfDays: '1', description: '', isCustomItem: false, customName: '', customCategory: '' }],
        taxEnabled: false,
        taxRate: '10',
      },
    ]);
  };

  const removeSection = (sectionIndex: number) => {
    if (sections.length > 1) {
      setSections(sections.filter((_, i) => i !== sectionIndex));
    }
  };

  const cloneSection = (sectionIndex: number) => {
    const sectionToClone = sections[sectionIndex];
    const clonedSection = {
      name: `${sectionToClone.name} (Copy)`,
      items: sectionToClone.items.map(item => ({ ...item })),
      taxEnabled: sectionToClone.taxEnabled,
      taxRate: sectionToClone.taxRate,
    };
    setSections([...sections, clonedSection]);
  };

  const updateSectionName = (sectionIndex: number, name: string) => {
    const newSections = [...sections];
    newSections[sectionIndex].name = name;
    setSections(newSections);
  };

  const updateSectionTaxEnabled = (sectionIndex: number, enabled: boolean) => {
    const newSections = [...sections];
    newSections[sectionIndex].taxEnabled = enabled;
    setSections(newSections);
  };

  const updateSectionTaxRate = (sectionIndex: number, rate: string) => {
    const newSections = [...sections];
    newSections[sectionIndex].taxRate = rate;
    setSections(newSections);
  };

  const addItem = (sectionIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].items.push({ 
      equipmentId: '', 
      quantity: '1', 
      pricePerDay: '0.00', 
      numberOfDays: '1', 
      description: '', 
      isCustomItem: false,
      customName: '',
      customCategory: '',
    });
    setSections(newSections);
  };

  const removeItem = (sectionIndex: number, itemIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].items = newSections[sectionIndex].items.filter((_, i) => i !== itemIndex);
    setSections(newSections);
  };

  const updateItem = (sectionIndex: number, itemIndex: number, field: keyof QuoteItemForm, value: string | boolean) => {
    const newSections = [...sections];
    const item = newSections[sectionIndex].items[itemIndex];
    
    if (field === 'equipmentId' && typeof value === 'string' && value) {
      const selectedItem = catalogItems.find(cat => String(cat.item_id) === value);
      if (selectedItem) {
        item.pricePerDay = (Number(selectedItem.price) / 100).toFixed(2);
      }
    }
    
    // Type-safe assignment based on field type
    if (field === 'isCustomItem') {
      item[field] = value as boolean;
    } else {
      item[field] = value as string;
    }
    
    setSections(newSections);
  };

  const calculateSectionTotals = (section: QuoteSectionForm) => {
    const subtotalCents = section.items.reduce((sum, item) => {
      const pricePerDayCents = Math.round(parseFloat(item.pricePerDay || '0') * 100);
      const quantity = parseInt(item.quantity || '0');
      const days = parseInt(item.numberOfDays || '1');
      return sum + (pricePerDayCents * quantity * days);
    }, 0);
    
    const taxCents = section.taxEnabled 
      ? Math.round(subtotalCents * (Number(section.taxRate) / 100))
      : 0;
    
    const totalCents = subtotalCents + taxCents;
    return { subtotalCents, taxCents, totalCents };
  };

  const calculateTotals = () => {
    let subtotalCents = 0;
    let taxCents = 0;
    let totalCents = 0;

    sections.forEach((section) => {
      const sectionTotals = calculateSectionTotals(section);
      subtotalCents += sectionTotals.subtotalCents;
      taxCents += sectionTotals.taxCents;
      totalCents += sectionTotals.totalCents;
    });

    return { subtotalCents, taxCents, totalCents };
  };

  const filteredVenues = venues.filter((venue) => {
    const searchLower = venueSearchTerm.toLowerCase();
    return (
      venue.venue_name.toLowerCase().includes(searchLower) ||
      venue.city.toLowerCase().includes(searchLower) ||
      venue.state.toLowerCase().includes(searchLower)
    );
  });

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

  const getFilteredCatalogItems = (sectionIndex: number, itemIndex: number) => {
    const searchKey = `${sectionIndex}-${itemIndex}`;
    const searchTerm = equipmentSearchTerms[searchKey] || '';
    
    if (!searchTerm) {
      return catalogItems;
    }

    const searchLower = searchTerm.toLowerCase();
    return catalogItems.filter((item) => {
      return item.name.toLowerCase().includes(searchLower);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.eventStartDate) {
      return;
    }

    for (const section of sections) {
      if (!section.name.trim()) {
        return;
      }
      
      const invalidItems = section.items.filter(item => !item.isCustomItem && !item.equipmentId);
      if (invalidItems.length > 0) {
        return;
      }

      const invalidCustomItems = section.items.filter(item => item.isCustomItem && !item.customName.trim());
      if (invalidCustomItems.length > 0) {
        return;
      }
    }

    const { subtotalCents, taxCents, totalCents } = calculateTotals();

    const quoteSections: QuoteSection[] = sections.map((section) => {
      const sectionTotals = calculateSectionTotals(section);
      const quoteItems: QuoteItem[] = section.items.map((item) => ({
        equipmentId: item.isCustomItem || !item.equipmentId ? undefined : BigInt(item.equipmentId),
        quantity: BigInt(item.quantity),
        pricePerDayCents: BigInt(Math.round(parseFloat(item.pricePerDay || '0') * 100)),
        numberOfDays: BigInt(item.numberOfDays),
        description: item.isCustomItem ? item.description : undefined,
        isCustom: item.isCustomItem,
        customName: item.isCustomItem ? item.customName : undefined,
        customCategory: item.isCustomItem ? item.customCategory : undefined,
      }));

      return {
        name: section.name,
        items: quoteItems,
        subtotalCents: BigInt(sectionTotals.subtotalCents),
        taxCents: BigInt(sectionTotals.taxCents),
        totalCents: BigInt(sectionTotals.totalCents),
        tax_enabled: section.taxEnabled,
        tax_rate: BigInt(Math.round(parseFloat(section.taxRate || '0'))),
      };
    });

    if (editingQuote) {
      const quoteData = {
        clientId: BigInt(formData.clientId),
        venue_id: formData.venueId ? BigInt(formData.venueId) : undefined,
        event_start_date: formData.eventStartDate,
        event_end_date: formData.eventEndDate || undefined,
        createdBy: editingQuote.createdBy,
        sections: quoteSections,
        subtotalCents: BigInt(subtotalCents),
        taxCents: BigInt(taxCents),
        totalCents: BigInt(totalCents),
        status: formData.status,
        referenceNumber: formData.referenceNumber,
        office: formData.office,
      };

      await updateQuote.mutateAsync({
        id: editingQuote.id,
        quote: { ...quoteData, id: editingQuote.id },
      });
    } else {
      const quoteData = {
        clientId: BigInt(formData.clientId),
        venue_id: formData.venueId ? BigInt(formData.venueId) : undefined,
        event_start_date: formData.eventStartDate,
        event_end_date: formData.eventEndDate || undefined,
        createdBy: identity?.getPrincipal() || Principal.fromText('2vxsx-fae'),
        sections: quoteSections,
        subtotalCents: BigInt(subtotalCents),
        taxCents: BigInt(taxCents),
        totalCents: BigInt(totalCents),
        status: formData.status,
        referenceNumber: formData.referenceNumber,
        office: formData.office,
      };

      await createQuote.mutateAsync(quoteData);
    }

    onOpenChange(false);
  };

  const { subtotalCents, taxCents, totalCents } = calculateTotals();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuote ? 'Edit Quote' : 'Create Quote'}</DialogTitle>
            <DialogDescription>
              {editingQuote ? 'Update quote details and sections' : 'Create a new quote with multiple sections'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
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
                <Label htmlFor="office">Office *</Label>
                <Select value={formData.office} onValueChange={(value) => setFormData({ ...formData, office: value as EquipmentLocation })}>
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
                <Label htmlFor="referenceNumber">Reference Number *</Label>
                <Input
                  id="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as QuoteStatus })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={QuoteStatus.draft}>Draft</SelectItem>
                    <SelectItem value={QuoteStatus.sent}>Sent</SelectItem>
                    <SelectItem value={QuoteStatus.approved}>Approved</SelectItem>
                    <SelectItem value={QuoteStatus.rejected}>Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="venue">Venue</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setVenueDialogOpen(true)}>
                    <Plus className="h-3 w-3 mr-1" />
                    New Venue
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    placeholder="Search venues..."
                    value={venueSearchTerm}
                    onChange={(e) => setVenueSearchTerm(e.target.value)}
                    className="mb-2"
                  />
                  <Select value={formData.venueId} onValueChange={(value) => setFormData({ ...formData, venueId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select venue" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredVenues.map((venue) => (
                        <SelectItem key={Number(venue.venue_id)} value={String(venue.venue_id)}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span>{venue.venue_name} - {venue.city}, {venue.state}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventStartDate">Event Start Date *</Label>
                <Input
                  id="eventStartDate"
                  type="date"
                  value={formData.eventStartDate}
                  onChange={(e) => setFormData({ ...formData, eventStartDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventEndDate">Event End Date</Label>
                <Input
                  id="eventEndDate"
                  type="date"
                  value={formData.eventEndDate}
                  onChange={(e) => setFormData({ ...formData, eventEndDate: e.target.value })}
                  min={formData.eventStartDate}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Quote Sections</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSection}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Section
                </Button>
              </div>

              {sections.map((section, sectionIndex) => {
                const sectionTotals = calculateSectionTotals(section);
                
                return (
                  <Card key={sectionIndex} className="border-primary/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        {editingSectionIndex === sectionIndex ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editingSectionName}
                              onChange={(e) => setEditingSectionName(e.target.value)}
                              className="flex-1"
                              autoFocus
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                updateSectionName(sectionIndex, editingSectionName);
                                setEditingSectionIndex(null);
                              }}
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <>
                            <CardTitle className="text-base flex items-center gap-2">
                              {section.name}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  setEditingSectionIndex(sectionIndex);
                                  setEditingSectionName(section.name);
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </CardTitle>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => cloneSection(sectionIndex)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Clone
                              </Button>
                              {sections.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeSection(sectionIndex)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Remove
                                </Button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Card className="bg-muted/30">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Switch
                                  id={`tax-enabled-${sectionIndex}`}
                                  checked={section.taxEnabled}
                                  onCheckedChange={(checked) => updateSectionTaxEnabled(sectionIndex, checked)}
                                />
                                <Label htmlFor={`tax-enabled-${sectionIndex}`} className="cursor-pointer">
                                  Apply Tax to This Section
                                </Label>
                              </div>
                            </div>
                            {section.taxEnabled && (
                              <div className="space-y-2">
                                <Label htmlFor={`tax-rate-${sectionIndex}`}>Tax Rate (%)</Label>
                                <Input
                                  id={`tax-rate-${sectionIndex}`}
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={section.taxRate}
                                  onChange={(e) => updateSectionTaxRate(sectionIndex, e.target.value)}
                                  required
                                />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Items</Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => addItem(sectionIndex)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add Item
                        </Button>
                      </div>

                      {section.items.map((item, itemIndex) => {
                        const searchKey = `${sectionIndex}-${itemIndex}`;
                        const filteredItems = getFilteredCatalogItems(sectionIndex, itemIndex);
                        
                        return (
                          <Card key={itemIndex} className="bg-muted/30">
                            <CardContent className="pt-4">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`custom-${sectionIndex}-${itemIndex}`}
                                    checked={item.isCustomItem}
                                    onChange={(e) => {
                                      updateItem(sectionIndex, itemIndex, 'isCustomItem', e.target.checked);
                                      if (e.target.checked) {
                                        updateItem(sectionIndex, itemIndex, 'equipmentId', '');
                                      } else {
                                        updateItem(sectionIndex, itemIndex, 'customName', '');
                                        updateItem(sectionIndex, itemIndex, 'customCategory', '');
                                        updateItem(sectionIndex, itemIndex, 'description', '');
                                      }
                                    }}
                                    className="h-4 w-4"
                                  />
                                  <Label htmlFor={`custom-${sectionIndex}-${itemIndex}`} className="text-sm font-normal cursor-pointer">
                                    Text item
                                  </Label>
                                </div>

                                {item.isCustomItem ? (
                                  <div className="space-y-3">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      <div className="space-y-2">
                                        <Label>Item Name *</Label>
                                        <Input
                                          value={item.customName}
                                          onChange={(e) => updateItem(sectionIndex, itemIndex, 'customName', e.target.value)}
                                          placeholder="e.g., LED Panel Light"
                                          required
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Input
                                          value={item.customCategory}
                                          onChange={(e) => updateItem(sectionIndex, itemIndex, 'customCategory', e.target.value)}
                                          placeholder="e.g., Lighting"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Description</Label>
                                      <Textarea
                                        value={item.description}
                                        onChange={(e) => updateItem(sectionIndex, itemIndex, 'description', e.target.value)}
                                        placeholder="Additional details about this item"
                                        rows={2}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <Label>Equipment</Label>
                                    <Input
                                      placeholder="Type to search by name..."
                                      value={equipmentSearchTerms[searchKey] || ''}
                                      onChange={(e) => {
                                        setEquipmentSearchTerms({
                                          ...equipmentSearchTerms,
                                          [searchKey]: e.target.value,
                                        });
                                      }}
                                      className="mb-2"
                                    />
                                    <Select 
                                      value={item.equipmentId} 
                                      onValueChange={(value) => updateItem(sectionIndex, itemIndex, 'equipmentId', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select equipment" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {filteredItems.map((eq) => (
                                          <SelectItem key={Number(eq.item_id)} value={String(eq.item_id)}>
                                            {eq.name} - {getCategoryLabel(eq.category)} (${(Number(eq.price) / 100).toFixed(2)}/day)
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                <div className="grid gap-3 sm:grid-cols-4">
                                  <div className="space-y-2">
                                    <Label>Quantity</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => updateItem(sectionIndex, itemIndex, 'quantity', e.target.value)}
                                      required
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Price per Day ($)</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.pricePerDay}
                                      onChange={(e) => updateItem(sectionIndex, itemIndex, 'pricePerDay', e.target.value)}
                                      required
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Number of Days</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.numberOfDays}
                                      onChange={(e) => updateItem(sectionIndex, itemIndex, 'numberOfDays', e.target.value)}
                                      required
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Line Total</Label>
                                    <div className="flex gap-2 items-center h-10">
                                      <span className="text-sm font-medium">
                                        ${((parseFloat(item.pricePerDay || '0') * parseInt(item.quantity || '0') * parseInt(item.numberOfDays || '1'))).toFixed(2)}
                                      </span>
                                      {section.items.length > 1 && (
                                        <Button 
                                          type="button" 
                                          variant="outline" 
                                          size="icon" 
                                          onClick={() => removeItem(sectionIndex, itemIndex)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}

                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="pt-4">
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Section Subtotal:</span>
                              <span className="font-medium">${(sectionTotals.subtotalCents / 100).toFixed(2)}</span>
                            </div>
                            {section.taxEnabled && (
                              <div className="flex justify-between">
                                <span>Section Tax ({section.taxRate}%):</span>
                                <span className="font-medium">${(sectionTotals.taxCents / 100).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold border-t pt-1">
                              <span>Section Total:</span>
                              <span>${(sectionTotals.totalCents / 100).toFixed(2)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="bg-primary/10 border-primary/30">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Subtotal:</span>
                    <span className="font-medium">${(subtotalCents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Tax:</span>
                    <span className="font-medium">${(taxCents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Grand Total:</span>
                    <span className="text-primary">${(totalCents / 100).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={createQuote.isPending || updateQuote.isPending} className="flex-1">
                {createQuote.isPending || updateQuote.isPending ? 'Saving...' : editingQuote ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <VenueDialog open={venueDialogOpen} onOpenChange={setVenueDialogOpen} editingVenue={null} />
    </>
  );
}
