
"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserCircle2, UploadCloud, Edit } from "lucide-react"; // Added Edit icon
import React, { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input"; 
import Link from "next/link"; // Added Link

export default function ProfilePage() {
  const { user, updateProfileImage } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="font-body">Loading user profile...</p>
      </div>
    );
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (e.g., JPG, PNG).",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        const success = await updateProfileImage(dataUrl);
        if (success) {
          toast({
            title: "Profile Image Updated",
            description: "Your new profile image has been saved.",
            variant: "default",
          });
        } else {
          toast({
            title: "Upload Failed",
            description: "Could not update your profile image. Please try again.",
            variant: "destructive",
          });
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast({
          title: "File Read Error",
          description: "Could not read the selected file. Please try again.",
          variant: "destructive",
        });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
    if (event.target) {
        event.target.value = "";
    }
  };

  const avatarText = user.name ? user.name.substring(0, 2).toUpperCase() : <UserCircle2 />;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="relative mx-auto mb-4 group">
            <Avatar className="h-24 w-24 border-2 border-primary shadow-md cursor-pointer" onClick={handleAvatarClick}>
              <AvatarImage src={user.profileImageUrl || `https://placehold.co/150x150.png?text=${avatarText}`} alt={user.name} />
              <AvatarFallback className="text-3xl">{avatarText}</AvatarFallback>
            </Avatar>
            <div 
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={handleAvatarClick}
            >
                <UploadCloud className="h-8 w-8 text-white" />
            </div>
          </div>
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={isUploading}
          />
          <CardTitle className="font-headline text-3xl text-primary">{user.name}</CardTitle>
          <CardDescription className="font-body text-lg capitalize">{user.role}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-code text-sm text-muted-foreground">Email</h3>
            <p className="font-body text-lg">{user.email}</p>
          </div>
          {user.phoneNumber && (
            <div>
              <h3 className="font-code text-sm text-muted-foreground">Phone Number</h3>
              <p className="font-body text-lg">{user.phoneNumber}</p>
            </div>
          )}
          <Button asChild className="w-full mt-6 btn-gradient-primary">
            <Link href="/profile/edit">
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button> 
        </CardContent>
      </Card>
    </div>
  );
}
