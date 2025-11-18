import { useState, useMemo } from 'react';
import { useGetConfirmedQuotes, useGetAllClients, useGetAllCatalogItems, useGetAllVendors, useGetAllVenues, useGetAllAssetUnits } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Package, ChevronDown, ChevronUp, MapPin, Calendar } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Quote, EquipmentStatus } from '../backend';
import { EquipmentLocation } from '../backend';
import { toast } from 'sonner';

declare global {
  interface Window {
    jspdf: {
      jsPDF: any;
    };
  }
}

// Helper function to check if date ranges overlap
function datesOverlap(start1: string, end1: string | undefined, start2: string, end2: string | undefined): boolean {
  const s1 = new Date(start1);
  const e1 = end1 ? new Date(end1) : new Date(start1);
  const s2 = new Date(start2);
  const e2 = end2 ? new Date(end2) : new Date(start2);
  
  return s1 <= e2 && s2 <= e1;
}

export default function Prep() {
  const { data: quotes = [], isLoading: quotesLoading } = useGetConfirmedQuotes();
  const { data: clients = [] } = useGetAllClients();
  const { data: catalogItems = [] } = useGetAllCatalogItems();
  const { data: vendors = [] } = useGetAllVendors();
  const { data: venues = [] } = useGetAllVenues();
  const { data: assetUnits = [] } = useGetAllAssetUnits();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedQuote, setExpandedQuote] = useState<bigint | null>(null);
  const [subrentals, setSubrentals] = useState<Record<string, { enabled: boolean; vendorId: bigint | null; quantity: number }>>({});
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const filteredQuotes = quotes.filter((quote) => {
    const client = clients.find((c) => c.id === quote.clientId);
    const searchLower = searchTerm.toLowerCase();
    return (
      quote.referenceNumber.toLowerCase().includes(searchLower) ||
      client?.name.toLowerCase().includes(searchLower)
    );
  });

  const getVenueInfo = (venueId: bigint | undefined) => {
    if (!venueId) return null;
    return venues.find((v) => v.venue_id === venueId);
  };

  const formatDateRange = (startDate: string, endDate?: string) => {
    if (!endDate || startDate === endDate) {
      return new Date(startDate).toLocaleDateString();
    }
    return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
  };

  const toggleQuoteExpansion = (quoteId: bigint) => {
    setExpandedQuote(expandedQuote === quoteId ? null : quoteId);
  };

  const handleSubrentalToggle = (quoteId: bigint, itemId: bigint, enabled: boolean) => {
    const key = `${quoteId}-${itemId}`;
    setSubrentals((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled, vendorId: prev[key]?.vendorId || null, quantity: prev[key]?.quantity || 0 },
    }));
  };

  const handleVendorSelect = (quoteId: bigint, itemId: bigint, vendorId: string) => {
    const key = `${quoteId}-${itemId}`;
    setSubrentals((prev) => ({
      ...prev,
      [key]: { ...prev[key], vendorId: BigInt(vendorId), enabled: prev[key]?.enabled || false, quantity: prev[key]?.quantity || 0 },
    }));
  };

  const handleQuantityChange = (quoteId: bigint, itemId: bigint, quantity: number) => {
    const key = `${quoteId}-${itemId}`;
    setSubrentals((prev) => ({
      ...prev,
      [key]: { ...prev[key], quantity, enabled: prev[key]?.enabled || false, vendorId: prev[key]?.vendorId || null },
    }));
  };

  // Calculate available quantity for a specific item at a specific office location
  // accounting for overlapping confirmed quotes at that same office
  const getAvailableQuantity = useMemo(() => {
    return (itemId: bigint, office: EquipmentLocation, currentQuoteId: bigint, startDate: string, endDate: string | undefined): number => {
      // Count total available assets at this specific office location
      const totalAvailable = assetUnits.filter(
        (unit) => 
          unit.item_id === itemId && 
          unit.office_location === office && 
          unit.status === ('available' as EquipmentStatus)
      ).length;

      // Calculate allocated quantities from overlapping confirmed quotes at the same office (excluding current quote)
      let allocated = 0;
      for (const quote of quotes) {
        // Skip the current quote we're viewing
        if (quote.id === currentQuoteId) continue;
        
        // Only consider quotes from the same office location
        if (quote.office !== office) continue;

        // Check if dates overlap
        if (!datesOverlap(quote.event_start_date, quote.event_end_date, startDate, endDate)) {
          continue;
        }

        // Sum up quantities for this item in overlapping quotes
        for (const section of quote.sections) {
          for (const item of section.items) {
            if (!item.isCustom && item.equipmentId === itemId) {
              allocated += Number(item.quantity);
            }
          }
        }
      }

      return Math.max(0, totalAvailable - allocated);
    };
  }, [assetUnits, quotes]);

  // Calculate shortage for a specific item at a specific office
  const calculateShortage = (itemId: bigint, office: EquipmentLocation, requiredQuantity: number, currentQuoteId: bigint, startDate: string, endDate: string | undefined): number => {
    const available = getAvailableQuantity(itemId, office, currentQuoteId, startDate, endDate);
    return available - requiredQuantity;
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const loadJsPDF = async () => {
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.async = true;
      document.body.appendChild(script);
      
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }
  };

  const generatePullListPDF = async (quote: Quote) => {
    try {
      setGeneratingPdf(true);
      const client = clients.find((c) => c.id === quote.clientId);
      const venue = getVenueInfo(quote.venue_id);
      
      await loadJsPDF();
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      // Load and add logo
      try {
        const logo = await loadImage('/assets/pt_full-red-whiteback.png');
        pdf.addImage(logo, 'PNG', 40, 30, 200, 60);
      } catch (error) {
        console.error('Failed to load logo:', error);
      }

      const blackColor = [0, 0, 0];
      const grayColor = [100, 100, 100];

      // Title
      pdf.setFontSize(22);
      pdf.setTextColor(...blackColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMPLETE PULL LIST', 40, 120);

      // Job info
      pdf.setFontSize(11);
      pdf.setTextColor(...grayColor);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Job #: ${quote.referenceNumber}`, 40, 140);
      pdf.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 40, 155);

      // Divider
      pdf.setDrawColor(...blackColor);
      pdf.setLineWidth(2);
      pdf.line(40, 170, 555, 170);

      let yPos = 190;

      // Client information
      pdf.setFontSize(11);
      pdf.setTextColor(...blackColor);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Client: ${client?.name || 'Unknown'}`, 40, yPos);
      yPos += 15;

      // Office location
      pdf.text(`Office: ${getOfficeLabel(quote.office)}`, 40, yPos);
      yPos += 15;

      // Venue/Delivery Location
      if (venue) {
        pdf.text(`Delivery Location: ${venue.venue_name}`, 40, yPos);
        yPos += 15;
        pdf.text(`${venue.address_line_1}${venue.address_line_2 ? ', ' + venue.address_line_2 : ''}`, 40, yPos);
        yPos += 15;
        pdf.text(`${venue.city}, ${venue.state} ${venue.postal_code}`, 40, yPos);
        yPos += 15;
      }

      // Event dates
      if (quote.event_start_date) {
        pdf.text(`Event Dates: ${formatDateRange(quote.event_start_date, quote.event_end_date)}`, 40, yPos);
        yPos += 15;
      }

      yPos += 10;

      // Items by section
      for (const section of quote.sections) {
        if (yPos > 700) {
          pdf.addPage();
          yPos = 40;
        }

        // Section divider
        pdf.setDrawColor(...blackColor);
        pdf.setLineWidth(2);
        pdf.line(40, yPos, 555, yPos);
        yPos += 20;

        pdf.setFontSize(14);
        pdf.setTextColor(...blackColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text(section.name.toUpperCase(), 40, yPos);
        yPos += 25;

        // Table header
        pdf.setFillColor(240, 240, 240);
        pdf.rect(40, yPos - 15, 515, 25, 'F');
        
        pdf.setFontSize(10);
        pdf.setTextColor(...blackColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Item', 45, yPos);
        pdf.text('Qty Required', 450, yPos);

        yPos += 25;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);

        for (let i = 0; i < section.items.length; i++) {
          const item = section.items[i];
          
          if (yPos > 750) {
            pdf.addPage();
            yPos = 40;
          }

          let itemName = '';
          if (item.isCustom) {
            itemName = item.customName || 'Custom Item';
            if (item.customCategory) {
              itemName += ` (${item.customCategory})`;
            }
          } else {
            const catalogItem = catalogItems.find(c => c.item_id === item.equipmentId);
            if (catalogItem) {
              itemName = `${catalogItem.name} - ${catalogItem.category}`;
            } else {
              itemName = 'Item missing in Inventory';
            }
          }
          
          const quantity = Number(item.quantity);

          if (i % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(40, yPos - 12, 515, 20, 'F');
          }

          pdf.setTextColor(...blackColor);
          const maxWidth = 380;
          const lines = pdf.splitTextToSize(itemName, maxWidth);
          pdf.text(lines[0], 45, yPos);
          pdf.text(String(quantity), 450, yPos);

          yPos += 20;
        }

        yPos += 20;
      }

      pdf.save(`pull-list-${quote.referenceNumber}.pdf`);
      toast.success('Pull list PDF generated successfully');
    } catch (error) {
      console.error('Error generating pull list PDF:', error);
      toast.error('Failed to generate pull list PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const generateSubrentalPDFs = async (quote: Quote) => {
    try {
      setGeneratingPdf(true);
      const client = clients.find((c) => c.id === quote.clientId);
      const venue = getVenueInfo(quote.venue_id);

      // Group subrentals by vendor
      const subrentalsByVendor: Record<string, Array<{ itemName: string; quantity: number; section: string }>> = {};

      for (const section of quote.sections) {
        for (const item of section.items) {
          if (!item.isCustom && item.equipmentId) {
            const key = `${quote.id}-${item.equipmentId}`;
            const subrentalData = subrentals[key];
            
            if (subrentalData?.enabled && subrentalData.vendorId && subrentalData.quantity > 0) {
              const vendorId = subrentalData.vendorId.toString();
              if (!subrentalsByVendor[vendorId]) {
                subrentalsByVendor[vendorId] = [];
              }

              const catalogItem = catalogItems.find(c => c.item_id === item.equipmentId);
              const itemName = catalogItem ? `${catalogItem.name} - ${catalogItem.category}` : 'Item missing in Inventory';

              subrentalsByVendor[vendorId].push({
                itemName,
                quantity: subrentalData.quantity,
                section: section.name,
              });
            }
          }
        }
      }

      if (Object.keys(subrentalsByVendor).length === 0) {
        toast.error('No subrentals configured for this job');
        setGeneratingPdf(false);
        return;
      }

      await loadJsPDF();
      const { jsPDF } = window.jspdf;

      // Generate one PDF per vendor
      for (const [vendorId, items] of Object.entries(subrentalsByVendor)) {
        const vendor = vendors.find(v => v.id.toString() === vendorId);
        if (!vendor) continue;

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4',
        });

        // Load and add logo
        try {
          const logo = await loadImage('/assets/pt_full-red-whiteback.png');
          pdf.addImage(logo, 'PNG', 40, 30, 200, 60);
        } catch (error) {
          console.error('Failed to load logo:', error);
        }

        const blackColor = [0, 0, 0];
        const grayColor = [100, 100, 100];

        // Title
        pdf.setFontSize(22);
        pdf.setTextColor(...blackColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SUBRENTAL ORDER', 40, 120);

        // Job info
        pdf.setFontSize(11);
        pdf.setTextColor(...grayColor);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Job #: ${quote.referenceNumber}`, 40, 140);
        pdf.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 40, 155);

        // Divider
        pdf.setDrawColor(...blackColor);
        pdf.setLineWidth(2);
        pdf.line(40, 170, 555, 170);

        let yPos = 190;

        // Vendor information
        pdf.setFontSize(12);
        pdf.setTextColor(...blackColor);
        pdf.setFont('helvetica', 'bold');
        pdf.text('VENDOR:', 40, yPos);
        yPos += 15;

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${vendor.name}`, 40, yPos);
        yPos += 15;
        pdf.text(`Contact: ${vendor.primaryContactName}`, 40, yPos);
        yPos += 15;
        pdf.text(`Email: ${vendor.email}`, 40, yPos);
        yPos += 15;
        pdf.text(`Phone: ${vendor.phoneNumber}`, 40, yPos);
        yPos += 15;
        if (vendor.address) {
          pdf.text(`Address: ${vendor.address}`, 40, yPos);
          yPos += 15;
        }

        yPos += 10;

        // Client and venue info
        pdf.text(`Client: ${client?.name || 'Unknown'}`, 40, yPos);
        yPos += 15;

        // Office location
        pdf.text(`Office: ${getOfficeLabel(quote.office)}`, 40, yPos);
        yPos += 15;

        if (venue) {
          pdf.text(`Delivery Location: ${venue.venue_name}`, 40, yPos);
          yPos += 15;
          pdf.text(`${venue.address_line_1}${venue.address_line_2 ? ', ' + venue.address_line_2 : ''}`, 40, yPos);
          yPos += 15;
          pdf.text(`${venue.city}, ${venue.state} ${venue.postal_code}`, 40, yPos);
          yPos += 15;
        }

        if (quote.event_start_date) {
          pdf.text(`Event Dates: ${formatDateRange(quote.event_start_date, quote.event_end_date)}`, 40, yPos);
          yPos += 15;
        }

        yPos += 20;

        // Group items by section
        const itemsBySection: Record<string, Array<{ itemName: string; quantity: number }>> = {};
        for (const item of items) {
          if (!itemsBySection[item.section]) {
            itemsBySection[item.section] = [];
          }
          itemsBySection[item.section].push({ itemName: item.itemName, quantity: item.quantity });
        }

        // Items by section
        for (const [sectionName, sectionItems] of Object.entries(itemsBySection)) {
          if (yPos > 700) {
            pdf.addPage();
            yPos = 40;
          }

          // Section divider
          pdf.setDrawColor(...blackColor);
          pdf.setLineWidth(2);
          pdf.line(40, yPos, 555, yPos);
          yPos += 20;

          pdf.setFontSize(14);
          pdf.setTextColor(...blackColor);
          pdf.setFont('helvetica', 'bold');
          pdf.text(sectionName.toUpperCase(), 40, yPos);
          yPos += 25;

          // Table header
          pdf.setFillColor(240, 240, 240);
          pdf.rect(40, yPos - 15, 515, 25, 'F');
          
          pdf.setFontSize(10);
          pdf.setTextColor(...blackColor);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Item', 45, yPos);
          pdf.text('Qty', 450, yPos);

          yPos += 25;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);

          for (let i = 0; i < sectionItems.length; i++) {
            const item = sectionItems[i];
            
            if (yPos > 750) {
              pdf.addPage();
              yPos = 40;
            }

            if (i % 2 === 0) {
              pdf.setFillColor(250, 250, 250);
              pdf.rect(40, yPos - 12, 515, 20, 'F');
            }

            pdf.setTextColor(...blackColor);
            const maxWidth = 380;
            const lines = pdf.splitTextToSize(item.itemName, maxWidth);
            pdf.text(lines[0], 45, yPos);
            pdf.text(String(item.quantity), 450, yPos);

            yPos += 20;
          }

          yPos += 20;
        }

        pdf.save(`subrental-${vendor.name.replace(/\s+/g, '-')}-${quote.referenceNumber}.pdf`);
      }

      toast.success(`Generated ${Object.keys(subrentalsByVendor).length} subrental PDF(s)`);
    } catch (error) {
      console.error('Error generating subrental PDFs:', error);
      toast.error('Failed to generate subrental PDFs. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const getOfficeLabel = (office: EquipmentLocation) => {
    const officeMap: Record<EquipmentLocation, string> = {
      [EquipmentLocation.dallas]: 'Dallas',
      [EquipmentLocation.miami]: 'Miami',
      [EquipmentLocation.phoenix]: 'Phoenix',
      [EquipmentLocation.minneapolis]: 'Minneapolis',
    };
    return officeMap[office];
  };

  if (quotesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading confirmed jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prep</h1>
          <p className="text-muted-foreground mt-1">Manage confirmed jobs and subrentals</p>
        </div>
        <img src="/assets/generated/prep-icon-transparent.dim_64x64.png" alt="Prep" className="h-16 w-16 opacity-80" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by job number or client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No confirmed jobs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuotes.map((quote) => {
                const client = clients.find((c) => c.id === quote.clientId);
                const venue = getVenueInfo(quote.venue_id);
                const isExpanded = expandedQuote === quote.id;

                return (
                  <Card key={quote.id.toString()} className="border-2">
                    <CardHeader className="cursor-pointer" onClick={() => toggleQuoteExpansion(quote.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <CardTitle className="text-lg">Job #{quote.referenceNumber}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Client: {client?.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Office: {getOfficeLabel(quote.office)}
                            </p>
                            {venue && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                Delivery Location: {venue.venue_name}, {venue.city}, {venue.state}
                              </p>
                            )}
                            {quote.event_start_date && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                Event Dates: {formatDateRange(quote.event_start_date, quote.event_end_date)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{quote.sections.length} sections</Badge>
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="space-y-6">
                        {quote.sections.map((section, sectionIdx) => (
                          <div key={sectionIdx} className="border rounded-lg p-4 space-y-3">
                            <h3 className="font-semibold text-primary">{section.name}</h3>
                            <div className="space-y-2">
                              {section.items.map((item, itemIdx) => {
                                const catalogItem = item.equipmentId ? catalogItems.find((c) => c.item_id === item.equipmentId) : null;
                                const itemName = item.isCustom 
                                  ? (item.customName || 'Custom Item') 
                                  : (catalogItem ? catalogItem.name : 'Item missing in Inventory');
                                
                                const requiredQty = Number(item.quantity);
                                const availableQty = item.equipmentId && !item.isCustom 
                                  ? getAvailableQuantity(item.equipmentId, quote.office, quote.id, quote.event_start_date, quote.event_end_date || quote.event_start_date)
                                  : requiredQty;
                                const shortage = item.equipmentId && !item.isCustom
                                  ? calculateShortage(item.equipmentId, quote.office, requiredQty, quote.id, quote.event_start_date, quote.event_end_date || quote.event_start_date)
                                  : 0;

                                const key = `${quote.id}-${item.equipmentId || itemIdx}`;
                                const subrentalData = subrentals[key] || { enabled: false, vendorId: null, quantity: 0 };

                                return (
                                  <div key={itemIdx} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                                    <div className="flex-1">
                                      <p className="font-medium">{itemName}</p>
                                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                        <span>Qty: {requiredQty}</span>
                                        <span>Available at {getOfficeLabel(quote.office)}: {availableQty}</span>
                                        <span className={shortage < 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                                          {shortage < 0 ? `Short: ${Math.abs(shortage)}` : `Surplus: ${shortage}`}
                                        </span>
                                      </div>
                                    </div>
                                    {!item.isCustom && item.equipmentId && (
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                          <Switch
                                            checked={subrentalData.enabled}
                                            onCheckedChange={(checked) => handleSubrentalToggle(quote.id, item.equipmentId!, checked)}
                                          />
                                          <Label className="text-sm">Subrent</Label>
                                        </div>
                                        {subrentalData.enabled && (
                                          <>
                                            <Select
                                              value={subrentalData.vendorId?.toString() || ''}
                                              onValueChange={(value) => handleVendorSelect(quote.id, item.equipmentId!, value)}
                                            >
                                              <SelectTrigger className="w-48">
                                                <SelectValue placeholder="Select vendor" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {vendors.map((vendor) => (
                                                  <SelectItem key={vendor.id.toString()} value={vendor.id.toString()}>
                                                    {vendor.name}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                            <Input
                                              type="number"
                                              placeholder="Qty"
                                              value={subrentalData.quantity || ''}
                                              onChange={(e) => handleQuantityChange(quote.id, item.equipmentId!, parseInt(e.target.value) || 0)}
                                              className="w-20"
                                            />
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                        <div className="flex gap-3 pt-4 border-t">
                          <Button 
                            onClick={() => generatePullListPDF(quote)} 
                            className="flex-1"
                            disabled={generatingPdf}
                          >
                            {generatingPdf ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <FileText className="h-4 w-4 mr-2" />
                                Complete Pull List
                              </>
                            )}
                          </Button>
                          <Button 
                            onClick={() => generateSubrentalPDFs(quote)} 
                            variant="outline" 
                            className="flex-1"
                            disabled={generatingPdf}
                          >
                            {generatingPdf ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Package className="h-4 w-4 mr-2" />
                                Sub Rentals
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
