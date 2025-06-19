
"use client";

import { useState, ChangeEvent, DragEvent, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { UploadCloud, Trash2, ImagePlus } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ImageUploaderProps {
  onImagesChange: (files: File[]) => void;
  initialImageUrls?: string[]; // For editing existing properties
}

interface PreviewImage {
  id: string; // Unique ID for key prop
  url: string; // blob: URL for new files, http/data for initial
  file?: File; // Original File object for new uploads
  isInitial: boolean;
}

export function ImageUploader({ onImagesChange, initialImageUrls = [] }: ImageUploaderProps) {
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Initialize previews from initialImageUrls
    const initialPreviews: PreviewImage[] = initialImageUrls.map((url, index) => ({
      id: `initial-${index}-${Date.now()}`,
      url: url,
      isInitial: true,
    }));
    setPreviewImages(initialPreviews);
  }, [initialImageUrls]);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      processFiles(Array.from(files));
    }
  };
  
  const processFiles = (filesArray: File[]) => {
    const newFilePreviews: PreviewImage[] = filesArray.map(file => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file: file,
      isInitial: false,
    }));

    setPreviewImages(prev => {
      const updatedPreviews = [...prev, ...newFilePreviews];
      // Notify parent about all *new* files
      const newFiles = updatedPreviews.filter(p => !p.isInitial && p.file).map(p => p.file!);
      onImagesChange(newFiles);
      return updatedPreviews;
    });
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files) {
      processFiles(Array.from(files));
    }
  };

  const removeImage = (idToRemove: string) => {
    setPreviewImages(prev => {
      const updatedPreviews = prev.filter(p => p.id !== idToRemove);
      
      // Revoke blob URL if it was a newly added file that's now removed
      const removedItem = prev.find(p => p.id === idToRemove);
      if (removedItem && !removedItem.isInitial && removedItem.url.startsWith('blob:')) {
        URL.revokeObjectURL(removedItem.url);
      }

      // Notify parent about the change in the list of *new* files
      const newFiles = updatedPreviews.filter(p => !p.isInitial && p.file).map(p => p.file!);
      onImagesChange(newFiles);
      return updatedPreviews;
    });
  };


  return (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                    ${isDragging ? "border-primary bg-primary/10" : "border-input hover:border-primary/50"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <Input
          id="file-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground font-body">
          Drag & drop images here, or click to select files
        </p>
        <p className="text-xs text-muted-foreground font-body">PNG, JPG, GIF up to 10MB</p>
      </div>

      {previewImages.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <div className="flex w-max space-x-4 p-4">
            {previewImages.map((img) => (
              <div key={img.id} className="relative group w-32 h-32 flex-shrink-0">
                <Image
                  src={img.url}
                  alt={`Preview ${img.file?.name || 'initial image'}`}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-md"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                  aria-label="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
             <div 
                className="w-32 h-32 flex-shrink-0 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-colors hover:border-primary/50 text-muted-foreground hover:text-primary"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <ImagePlus className="h-8 w-8" />
                <span className="text-xs mt-1">Add More</span>
              </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}

