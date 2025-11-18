import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useImportCsvData } from '../hooks/useQueries';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedItem {
  itemName: string;
  category: string;
  description: string;
  price: string;
  assetTag: string;
  location: string;
  notes: string;
}

export default function CsvImportDialog({ open, onOpenChange }: CsvImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importCsvData = useImportCsvData();

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a valid CSV file');
      return;
    }

    setFile(selectedFile);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const items = parseCSV(text);
        setParsedItems(items);
      } catch (err) {
        setError('Failed to parse CSV file. Please check the format.');
        setParsedItems([]);
      }
    };
    reader.readAsText(selectedFile);
  };

  const parseCSV = (text: string): ParsedItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const items: ParsedItem[] = [];

    const startIndex = lines[0].toLowerCase().includes('item_name') || 
                       lines[0].toLowerCase().includes('category') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = line.split(/[,\t]/).map(field => field.trim().replace(/^["']|["']$/g, ''));
      
      if (fields.length >= 7) {
        items.push({
          itemName: fields[0],
          category: fields[1],
          description: fields[2] || '',
          price: fields[3] || '0',
          assetTag: fields[4],
          location: fields[5] || 'Dallas',
          notes: fields[6] || '',
        });
      }
    }

    return items;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvData = e.target?.result as string;
        await importCsvData.mutateAsync(csvData);
        handleClose();
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Failed to import CSV data');
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedItems([]);
    setError('');
    onOpenChange(false);
  };

  const uniqueItems = new Set(parsedItems.map(item => `${item.itemName}-${item.category}-${item.description}-${item.price}`)).size;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Equipment from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import catalog items and asset units. Each row represents one physical asset.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Drop your CSV file here</h3>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleFileSelect(selectedFile);
                }}
              />
              <p className="text-xs text-muted-foreground mt-4">
                Expected format: item_name, category, description, price, asset_tag, location, notes
              </p>
            </div>
          ) : (
            <>
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>{file.name}</strong> - {parsedItems.length} asset units found across {uniqueItems} catalog items
                </AlertDescription>
              </Alert>

              {parsedItems.length > 0 && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <h4 className="text-sm font-semibold mb-2">Preview:</h4>
                  <ScrollArea className="flex-1 border rounded-lg">
                    <div className="p-4 space-y-2">
                      {parsedItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{item.itemName}</span>
                            <span className="text-muted-foreground"> - {item.category}</span>
                            <span className="text-muted-foreground"> - ${item.price}/day</span>
                            <span className="text-xs text-muted-foreground/80 block font-mono">
                              Asset: {item.assetTag} • {item.location}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </>
          )}

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
          {file && (
            <Button
              onClick={() => {
                setFile(null);
                setParsedItems([]);
                setError('');
              }}
              variant="outline"
            >
              Choose Different File
            </Button>
          )}
          <Button
            onClick={handleImport}
            disabled={!file || parsedItems.length === 0 || importCsvData.isPending}
          >
            {importCsvData.isPending ? 'Importing...' : `Import ${parsedItems.length} Units`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
