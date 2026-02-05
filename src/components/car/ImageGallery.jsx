import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { base44 } from '@/api/base44Client';
import { cn } from "@/lib/utils";

export default function ImageGallery({ 
  checkInImages = [], 
  checkOutImages = [], 
  onUpdateImages,
  isLoading 
}) {
  const [activeTab, setActiveTab] = useState('check_in');
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const images = activeTab === 'check_in' ? checkInImages : checkOutImages;

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const newUrls = [];

    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newUrls.push(file_url);
    }

    const updatedImages = [...images, ...newUrls];
    if (activeTab === 'check_in') {
      await onUpdateImages({ check_in_images: updatedImages });
    } else {
      await onUpdateImages({ check_out_images: updatedImages });
    }

    setUploading(false);
    e.target.value = '';
  };

  const handleRemove = async (indexToRemove) => {
    const updatedImages = images.filter((_, i) => i !== indexToRemove);
    if (activeTab === 'check_in') {
      await onUpdateImages({ check_in_images: updatedImages });
    } else {
      await onUpdateImages({ check_out_images: updatedImages });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Photos
        </h3>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
        <button
          onClick={() => setActiveTab('check_in')}
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
            activeTab === 'check_in' 
              ? "bg-white text-slate-800 shadow-sm" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Check-In ({checkInImages.length})
        </button>
        <button
          onClick={() => setActiveTab('check_out')}
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
            activeTab === 'check_out' 
              ? "bg-white text-slate-800 shadow-sm" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          Check-Out ({checkOutImages.length})
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {images.map((url, index) => (
          <div 
            key={index} 
            className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100"
          >
            <img 
              src={url} 
              alt={`${activeTab} ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button 
                onClick={() => setPreviewImage(url)}
                className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
              >
                <ZoomIn className="w-4 h-4 text-slate-700" />
              </button>
              <button 
                onClick={() => handleRemove(index)}
                className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "aspect-square rounded-lg border-2 border-dashed border-slate-200",
            "flex flex-col items-center justify-center gap-1 text-slate-400",
            "hover:border-amber-400 hover:text-amber-500 transition-colors",
            uploading && "opacity-50 cursor-not-allowed"
          )}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Upload className="w-6 h-6" />
              <span className="text-xs">Upload</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleUpload}
      />

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="w-full h-auto"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}