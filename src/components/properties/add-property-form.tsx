
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ImageUploader } from "./image-uploader";
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { addProperty } from "@/lib/mock-data"; 
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle } from "lucide-react";
import type { Property } from "@/types";

const propertySchema = z.object({
  name: z.string().min(5, { message: "Property name must be at least 5 characters." }),
  address: z.string().min(10, { message: "Address must be at least 10 characters." }),
  price: z.coerce.number().min(1, { message: "Price must be a positive number." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Failed to get canvas context."));
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(img.src);

      resolve(canvas.toDataURL("image/jpeg", 0.85)); 
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(img.src);
      reject(error);
    };
  });
};


export function AddPropertyForm() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);


  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: "",
      address: "",
      price: 0,
      description: "",
    },
  });

  const handleImagesChange = useCallback((files: File[]) => {
    setImageFiles(files);
  }, []);

  async function onSubmit(data: PropertyFormValues) {
    if (!user || user.role !== "owner") {
      toast({ title: "Error", description: "You must be an owner to add a property.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true); 
    
    let imageUrls: string[] | null = [];
    if (imageFiles.length > 0) {
      setIsProcessingImages(true); 
      imageUrls = await Promise.all(
        imageFiles.map(file => resizeImage(file, 1280, 1280))
      ).catch(error => {
        console.error("Error processing files:", error);
        toast({
          title: "Image Processing Error",
          description: "Could not process one or more images. Please ensure files are valid and try again.",
          variant: "destructive",
        });
        setIsProcessingImages(false);
        setIsLoading(false);
        return null; 
      });
      setIsProcessingImages(false); 
    }


    if (!imageUrls && imageFiles.length > 0) { 
        setIsLoading(false);
        return;
    }
    
    const newProperty: Property = {
      id: String(Date.now()), 
      ownerId: user.id,
      ownerName: user.name,
      ...data,
      images: imageUrls && imageUrls.length > 0 ? imageUrls : ["https://placehold.co/600x400.png"],
    };

    addProperty(newProperty); 
    
    toast({
      title: "Property Added!",
      description: `"${data.name}" has been successfully listed.`,
      variant: "default",
    });
    setIsLoading(false);
    router.push("/properties/my-listings");
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-3xl text-primary">List Your Property</CardTitle>
        <CardDescription className="font-body">Fill in the details below to add your property to RentEasy.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-code">Property Name / Title</FormLabel>
                  <FormControl>
                    <Input className="font-code" placeholder="e.g., Spacious 2BHK in Koramangala" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-code">Address</FormLabel>
                  <FormControl>
                    <Input className="font-code" placeholder="e.g., YSR Nagar, Koyyalagudem, West Godavari, Andhra Pradesh" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-code">Price (₹ per month)</FormLabel>
                  <FormControl>
                    <Input className="font-code" type="number" placeholder="e.g., 25000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-code">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      className="font-code min-h-[120px]"
                      placeholder="Describe your property, its features, and nearby amenities like metro connectivity, markets, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel className="font-code">Property Images</FormLabel>
              <ImageUploader onImagesChange={handleImagesChange} />
              <FormMessage /> 
            </FormItem>

            <Button 
              type="submit" 
              className="w-full btn-gradient-primary font-code py-3 text-base" 
              disabled={isLoading || isProcessingImages}
            >
              {isProcessingImages ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing Images...
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Adding Property...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add Property
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
