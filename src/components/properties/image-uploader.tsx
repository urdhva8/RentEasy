"use client";

import { useState, ChangeEvent, DragEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { UploadCloud, Trash2, ImagePlus } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ImageUploaderProps {
  onImagesChange: (files: File[]) => void;
  initialImageUrls?: string[]; // For editing existing properties
}

export function ImageUploader({ onImagesChange, initialImageUrls = [] }: ImageUploaderProps) {
  const [imagePreviews, setImagePreviews] = useState<string[]>(initialImageUrls);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      processFiles(Array.from(files));
    }
  };
  
  const processFiles = (filesArray: File[]) => {
    const newImageFiles = [...imageFiles, ...filesArray];
    setImageFiles(newImageFiles);
    onImagesChange(newImageFiles);

    const newPreviews = filesArray.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
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

  const removeImage = (index: number) => {
    const newPreviews = [...imagePreviews];
    const newFiles = [...imageFiles];
    
    // Check if the image to remove is an initial URL or a newly uploaded file preview
    if (index < initialImageUrls.length && imagePreviews[index].startsWith('http')) {
        // This logic might need adjustment if initialImageUrls are mixed with new files in imagePreviews
        // For simplicity, this assumes initial URLs are at the start and not mixed with File object URLs.
        // If initial URLs can be removed, you'll need a way to signal this (e.g., separate state for removed initial URLs).
        // For now, let's assume we are only removing newly added files or their previews.
        // This part needs careful handling if initial URLs should be removable and affect 'imageFiles'.
        // The current implementation is more geared towards adding new files.
    } else {
      // Adjust index if initial URLs are present and we are removing a newly added file
      const fileIndexToRemove = index - initialImageUrls.filter(url => !url.startsWith('blob:')).length;
      if (fileIndexToRemove >= 0 && fileIndexToRemove < newFiles.length) {
        newFiles.splice(fileIndexToRemove, 1);
      }
    }

    newPreviews.splice(index, 1);
    
    setImagePreviews(newPreviews);
    setImageFiles(newFiles);
    onImagesChange(newFiles); // Notify parent about the change in files
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

      {imagePreviews.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <div className="flex w-max space-x-4 p-4">
            {imagePreviews.map((src, index) => (
              <div key={index} className="relative group w-32 h-32 flex-shrink-0">
                <Image
                  src={src}
                  alt={`Preview ${index + 1}`}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-md"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); removeImage(index); }}
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
