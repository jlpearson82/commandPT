import { useState } from 'react';
import { useGetAllQuotes, useDeleteQuote, useGetAllClients, useGetAllCatalogItems, useGetAllVenues } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Edit, Trash2, Download, MapPin } from 'lucide-react';
import { QuoteStatus, EquipmentLocation, type Quote } from '../backend';
import QuoteDialog from '../components/QuoteDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

declare global {
  interface Window {
    jspdf: {
      jsPDF: any;
    };
  }
}

export default function Quotes() {
  const { data: quotes = [], isLoading } = useGetAllQuotes();
  const { data: clients = [] } = useGetAllClients();
  const { data: catalogItems = [] } = useGetAllCatalogItems();
  const { data: venues = [] } = useGetAllVenues();
  const deleteQuote = useDeleteQuote();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);

  const filteredQuotes = quotes.filter((quote) => {
    return statusFilter === 'all' || quote.status === statusFilter;
  });

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setDialogOpen(true);
  };

  const handleDelete = (quote: Quote) => {
    setQuoteToDelete(quote);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (quoteToDelete) {
      await deleteQuote.mutateAsync(quoteToDelete.id);
      setDeleteDialogOpen(false);
      setQuoteToDelete(null);
    }
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

  const handleExportPDF = async (quote: Quote) => {
    const client = clients.find((c) => c.id === quote.clientId);
    const venue = quote.venue_id ? venues.find((v) => v.venue_id === quote.venue_id) : null;
    
    // Load jsPDF from CDN if not already loaded
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.async = true;
      document.body.appendChild(script);
      
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    // Load and add the new full logo
    try {
      const logo = await loadImage('/assets/pt_full-red-whiteback.png');
      pdf.addImage(logo, 'PNG', 40, 30, 200, 60);
    } catch (error) {
      console.error('Failed to load logo:', error);
    }

    // Set up colors - Black for improved contrast
    const blackColor = [0, 0, 0]; // Black text
    const grayColor = [100, 100, 100]; // Gray text

    // Quote title and reference
    pdf.setFontSize(22);
    pdf.setTextColor(...blackColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text('QUOTE', 40, 120);

    pdf.setFontSize(11);
    pdf.setTextColor(...grayColor);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Reference: ${quote.referenceNumber}`, 40, 140);
    pdf.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 40, 155);

    // Status badge
    const statusText = quote.status.charAt(0).toUpperCase() + quote.status.slice(1);
    pdf.setFontSize(10);
    pdf.setTextColor(...blackColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Status: ${statusText}`, 40, 170);

    // Client information section
    pdf.setDrawColor(...blackColor);
    pdf.setLineWidth(2);
    pdf.line(40, 190, 555, 190);

    let yPos = 210;
    pdf.setFontSize(11);
    pdf.setTextColor(...blackColor);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Name: ${client?.name || 'Unknown'}`, 40, yPos);
    yPos += 15;
    pdf.text(`Company: ${client?.company || 'N/A'}`, 40, yPos);
    yPos += 15;
    pdf.text(`Email: ${client?.email || 'N/A'}`, 40, yPos);
    yPos += 15;
    pdf.text(`Phone: ${client?.phone || 'N/A'}`, 40, yPos);
    yPos += 15;
    
    // Office location
    const officeLabel = getOfficeLabel(quote.office);
    pdf.text(`Office: ${officeLabel}`, 40, yPos);
    yPos += 15;

    // Venue information if available
    if (venue) {
      pdf.text(`Venue: ${venue.venue_name}`, 40, yPos);
      yPos += 15;
      pdf.text(`${venue.address_line_1}${venue.address_line_2 ? ', ' + venue.address_line_2 : ''}`, 40, yPos);
      yPos += 15;
      pdf.text(`${venue.city}, ${venue.state} ${venue.postal_code}`, 40, yPos);
      yPos += 15;
    }

    // Quote sections
    yPos += 10;

    for (const section of quote.sections) {
      // Check if we need a new page
      if (yPos > 700) {
        pdf.addPage();
        yPos = 40;
      }

      // Section dividing line
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
      pdf.text('Qty', 320, yPos);
      pdf.text('Days', 370, yPos);
      pdf.text('Rate/Day', 420, yPos);
      pdf.text('Total', 515, yPos, { align: 'right' });

      // Table rows
      yPos += 25;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);

      for (let i = 0; i < section.items.length; i++) {
        const item = section.items[i];
        
        // Check if we need a new page
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
        
        const pricePerDay = (Number(item.pricePerDayCents) / 100).toFixed(2);
        const days = Number(item.numberOfDays);
        const quantity = Number(item.quantity);
        const lineTotal = ((Number(item.pricePerDayCents) / 100) * days * quantity).toFixed(2);

        // Alternate row background
        if (i % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(40, yPos - 12, 515, 20, 'F');
        }

        pdf.setTextColor(...blackColor);
        
        // Wrap long item names
        const maxWidth = 260;
        const lines = pdf.splitTextToSize(itemName, maxWidth);
        pdf.text(lines[0], 45, yPos);
        
        pdf.text(String(quantity), 320, yPos);
        pdf.text(String(days), 370, yPos);
        pdf.text(`$${pricePerDay}`, 420, yPos);
        pdf.text(`$${lineTotal}`, 515, yPos, { align: 'right' });

        yPos += 20;

        // Add description if custom item has one
        if (item.isCustom && item.description) {
          pdf.setFontSize(8);
          pdf.setTextColor(...grayColor);
          const descLines = pdf.splitTextToSize(item.description, maxWidth);
          for (const line of descLines.slice(0, 2)) { // Max 2 lines
            pdf.text(line, 45, yPos);
            yPos += 12;
          }
          pdf.setFontSize(9);
          pdf.setTextColor(...blackColor);
        }
      }

      // Section summary with proper alignment
      yPos += 10;
      pdf.setDrawColor(...grayColor);
      pdf.setLineWidth(0.5);
      pdf.line(350, yPos, 555, yPos);

      yPos += 15;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...blackColor);
      pdf.text('Section Subtotal:', 350, yPos);
      pdf.text(`$${(Number(section.subtotalCents) / 100).toFixed(2)}`, 555, yPos, { align: 'right' });

      yPos += 15;
      if (section.tax_enabled) {
        pdf.text(`Section Tax (${Number(section.tax_rate)}%):`, 350, yPos);
        pdf.text(`$${(Number(section.taxCents) / 100).toFixed(2)}`, 555, yPos, { align: 'right' });
      } else {
        pdf.text('Section Tax:', 350, yPos);
        pdf.text('$0.00', 555, yPos, { align: 'right' });
      }

      yPos += 5;
      pdf.setDrawColor(...blackColor);
      pdf.setLineWidth(1);
      pdf.line(350, yPos, 555, yPos);

      yPos += 15;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...blackColor);
      pdf.text('Section Total:', 350, yPos);
      pdf.text(`$${(Number(section.totalCents) / 100).toFixed(2)}`, 555, yPos, { align: 'right' });

      yPos += 30;
    }

    // Grand total section with proper alignment
    if (yPos > 680) {
      pdf.addPage();
      yPos = 40;
    }

    yPos += 10;
    pdf.setDrawColor(...blackColor);
    pdf.setLineWidth(2);
    pdf.line(40, yPos, 555, yPos);

    yPos += 30;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...blackColor);
    pdf.text('Total Subtotal:', 350, yPos);
    pdf.text(`$${(Number(quote.subtotalCents) / 100).toFixed(2)}`, 555, yPos, { align: 'right' });

    yPos += 20;
    pdf.text('Total Tax:', 350, yPos);
    pdf.text(`$${(Number(quote.taxCents) / 100).toFixed(2)}`, 555, yPos, { align: 'right' });

    yPos += 10;
    pdf.setDrawColor(...blackColor);
    pdf.setLineWidth(3);
    pdf.line(350, yPos, 555, yPos);

    yPos += 25;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...blackColor);
    pdf.text('GRAND TOTAL:', 350, yPos);
    pdf.text(`$${(Number(quote.totalCents) / 100).toFixed(2)}`, 555, yPos, { align: 'right' });

    // Save the PDF
    pdf.save(`quote-${quote.referenceNumber}.pdf`);
  };

  const getStatusBadge = (status: QuoteStatus) => {
    const config = {
      [QuoteStatus.draft]: { variant: 'secondary' as const, label: 'Draft' },
      [QuoteStatus.sent]: { variant: 'default' as const, label: 'Sent' },
      [QuoteStatus.approved]: { variant: 'default' as const, label: 'Approved' },
      [QuoteStatus.rejected]: { variant: 'destructive' as const, label: 'Rejected' },
    };
    const { variant, label } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getClientName = (clientId: bigint) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const getTotalItems = (quote: Quote) => {
    return quote.sections.reduce((total, section) => total + section.items.length, 0);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading quotes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
          <p className="text-muted-foreground mt-1">{quotes.length} total quotes</p>
        </div>
        <Button onClick={() => { setEditingQuote(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Quote
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={QuoteStatus.draft}>Draft</SelectItem>
              <SelectItem value={QuoteStatus.sent}>Sent</SelectItem>
              <SelectItem value={QuoteStatus.approved}>Approved</SelectItem>
              <SelectItem value={QuoteStatus.rejected}>Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {filteredQuotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No quotes found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {statusFilter !== 'all'
                ? 'Try adjusting your filter'
                : 'Create your first quote to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredQuotes.map((quote) => (
            <Card key={Number(quote.id)} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{quote.referenceNumber}</CardTitle>
                      {getStatusBadge(quote.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Client: {getClientName(quote.clientId)}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      Office: {getOfficeLabel(quote.office)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {quote.sections.length} section{quote.sections.length !== 1 ? 's' : ''} • {getTotalItems(quote)} item{getTotalItems(quote) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExportPDF(quote)}>
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(quote)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(quote)}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Sections</p>
                    <p className="text-lg font-semibold">{quote.sections.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subtotal</p>
                    <p className="text-lg font-semibold">${(Number(quote.subtotalCents) / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total (incl. tax)</p>
                    <p className="text-lg font-semibold">${(Number(quote.totalCents) / 100).toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <QuoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingQuote={editingQuote}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete quote "{quoteToDelete?.referenceNumber}"? This action cannot be undone.
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
