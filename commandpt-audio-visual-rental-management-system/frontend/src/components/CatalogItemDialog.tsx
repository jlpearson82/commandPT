import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddCatalogItem, useUpdateCatalogItem } from '../hooks/useQueries';
import { Category, type CatalogItem, ExternalBlob } from '../backend';
import { Upload, X } from 'lucide-react';

interface CatalogItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: CatalogItem | null;
}

export default function CatalogItemDialog({ open, onOpenChange, editingItem }: CatalogItemDialogProps) {
  const addCatalogItem = useAddCatalogItem();
  const updateCatalogItem = useUpdateCatalogItem();

  const [formData, setFormData] = useState({
    name: '',
    category: '' as Category | '',
    description: '',
    price: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [existingPhoto, setExistingPhoto] = useState<ExternalBlob | null>(null);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        category: editingItem.category,
        description: editingItem.description,
        price: (Number(editingItem.price) / 100).toFixed(2),
      });
      setExistingPhoto(editingItem.item_photo || null);
      if (editingItem.item_photo) {
        setPhotoPreview(editingItem.item_photo.getDirectURL());
      } else {
        setPhotoPreview('');
      }
      setPhotoFile(null);
    } else {
      setFormData({
        name: '',
        category: '',
        description: '',
        price: '',
      });
      setPhotoFile(null);
      setPhotoPreview('');
      setExistingPhoto(null);
    }
  }, [editingItem, open]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setExistingPhoto(null);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setExistingPhoto(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category) {
      return;
    }

    let itemPhoto: ExternalBlob | undefined = undefined;

    if (photoFile) {
      const arrayBuffer = await photoFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      itemPhoto = ExternalBlob.fromBytes(uint8Array);
    } else if (existingPhoto) {
      itemPhoto = existingPhoto;
    }

    const itemData = {
      name: formData.name,
      category: formData.category as Category,
      description: formData.description,
      price: BigInt(Math.round(parseFloat(formData.price || '0') * 100)),
      item_photo: itemPhoto,
    };

    if (editingItem) {
      await updateCatalogItem.mutateAsync({
        id: editingItem.item_id,
        item: { ...itemData, item_id: editingItem.item_id },
      });
    } else {
      await addCatalogItem.mutateAsync(itemData);
    }

    onOpenChange(false);
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit Catalog Item' : 'Add Catalog Item'}</DialogTitle>
          <DialogDescription>
            {editingItem ? 'Update catalog item details' : 'Add a new catalog item to your inventory'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              placeholder="e.g., LED Par Light"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as Category })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Category.lighting}>{getCategoryLabel(Category.lighting)}</SelectItem>
                <SelectItem value={Category.audio}>{getCategoryLabel(Category.audio)}</SelectItem>
                <SelectItem value={Category.video}>{getCategoryLabel(Category.video)}</SelectItem>
                <SelectItem value={Category.cable}>{getCategoryLabel(Category.cable)}</SelectItem>
                <SelectItem value={Category.drape}>{getCategoryLabel(Category.drape)}</SelectItem>
                <SelectItem value={Category.miscellaneous}>{getCategoryLabel(Category.miscellaneous)}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Item description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (per day) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="pl-7"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">Item Photo</Label>
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Item preview" className="w-full h-48 object-cover rounded-lg border" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemovePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Upload item photo</p>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="cursor-pointer"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={addCatalogItem.isPending || updateCatalogItem.isPending} className="flex-1">
              {addCatalogItem.isPending || updateCatalogItem.isPending ? 'Saving...' : editingItem ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
