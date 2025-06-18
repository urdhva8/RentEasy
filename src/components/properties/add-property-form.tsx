
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
import { useState } from "react";
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

export function AddPropertyForm() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: "",
      address: "",
      price: 0,
      description: "",
    },
  });

  const handleImagesChange = (files: File[]) => {
    setImageFiles(files);
  };

  async function onSubmit(data: PropertyFormValues) {
    if (!user || user.role !== "owner") {
      toast({ title: "Error", description: "You must be an owner to add a property.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    // Simulate image upload and getting URLs
    const imageUrls = await Promise.all(
      imageFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      })
    );
    
    const newProperty: Property = {
      id: String(Date.now()), // Mock ID
      ownerId: user.id,
      ownerName: user.name,
      ...data,
      images: imageUrls.length > 0 ? imageUrls : ["https://placehold.co/600x400.png?text=No+Image+Provided"], // Add a default placeholder if no images uploaded
    };

    addProperty(newProperty); // Add to mock data
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Property Added!",
      description: `"${data.name}" has been successfully listed.`,
      variant: "default", // Explicitly set variant for success, if not default
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

            <Button type="submit" className="w-full btn-gradient-primary font-code py-3 text-base" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
              Add Property
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
