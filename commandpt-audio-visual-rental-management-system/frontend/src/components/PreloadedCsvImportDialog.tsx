import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useImportCsvData } from '../hooks/useQueries';
import { FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PreloadedCsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedItem {
  assetTag: string;
  name: string;
  category: string;
  description: string;
  manufacturer: string;
  model: string;
  location: string;
}

export default function PreloadedCsvImportDialog({ open, onOpenChange }: PreloadedCsvImportDialogProps) {
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCsvData] = useState<string>('');
  const importCsvData = useImportCsvData();

  useEffect(() => {
    if (open) {
      loadCsvFile();
    }
  }, [open]);

  const loadCsvFile = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/assets/asset_listing_report_11-17-2025_23-26-48.csv');
      if (!response.ok) {
        throw new Error('Failed to load CSV file');
      }
      
      const text = await response.text();
      setCsvData(text);
      const items = parseCSV(text);
      setParsedItems(items);
    } catch (err) {
      setError('Failed to load or parse the asset listing file. Please ensure the file exists.');
      setParsedItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseCSV = (text: string): ParsedItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const items: ParsedItem[] = [];

    const startIndex = lines[0].toLowerCase().includes('asset') || 
                       lines[0].toLowerCase().includes('tag') || 
                       lines[0].toLowerCase().includes('name') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = line.split(/[,\t]/).map(field => field.trim().replace(/^["']|["']$/g, ''));
      
      if (fields.length >= 7) {
        items.push({
          assetTag: fields[0],
          name: fields[1],
          category: fields[2],
          description: fields[3] || '',
          manufacturer: fields[4] || '',
          model: fields[5] || '',
          location: fields[6] || 'Dallas',
        });
      }
    }

    return items;
  };

  const handleImport = async () => {
    if (!csvData) return;

    try {
      await importCsvData.mutateAsync(csvData);
      handleClose();
    } catch (err) {
      setError('Failed to import CSV data. Please try again.');
    }
  };

  const handleClose = () => {
    setParsedItems([]);
    setError('');
    setCsvData('');
    onOpenChange(false);
  };

  const uniqueItems = new Set(parsedItems.map(item => item.name)).size;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Asset Listing Report</DialogTitle>
          <DialogDescription>
            Import equipment inventory from asset_listing_report_11-17-2025_23-26-48.csv. Items with matching names will be merged into one catalog item with multiple asset units.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Loading asset listing...</p>
              </div>
            </div>
          ) : parsedItems.length > 0 ? (
            <>
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>asset_listing_report_11-17-2025_23-26-48.csv</strong>
                  <div className="mt-1 text-sm">
                    {parsedItems.length} asset units found across {uniqueItems} catalog items
                  </div>
                </AlertDescription>
              </Alert>

              <div className="flex-1 overflow-hidden flex flex-col">
                <h4 className="text-sm font-semibold mb-2">Preview of items to import:</h4>
                <ScrollArea className="flex-1 border rounded-lg">
                  <div className="p-4 space-y-2">
                    {parsedItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-muted-foreground"> - {item.category}</span>
                          <span className="text-xs text-muted-foreground/80 block font-mono">
                            Asset: {item.assetTag} • {item.location}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Note:</strong> Items with matching names will be merged into one catalog item with multiple asset units, each with its unique asset tag.
                </AlertDescription>
              </Alert>
            </>
          ) : null}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedItems.length === 0 || importCsvData.isPending || isLoading}
          >
            {importCsvData.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              `Import ${parsedItems.length} Units`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
