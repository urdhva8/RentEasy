
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

const editProfileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phoneNumber: z.string().regex(/^\d{10}$/, { message: "Phone number must be 10 digits." }).optional().or(z.literal('')),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export function EditProfileForm() {
  const { user, updateUserProfileData, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user, form]);

  async function onSubmit(data: EditProfileFormValues) {
    if (!user) {
        toast({ title: "Error", description: "User not found.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    const success = await updateUserProfileData({
        name: data.name,
        phoneNumber: data.phoneNumber || undefined, // Send undefined if empty to clear it
    });

    if (success) {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved.",
        variant: "default",
      });
      router.push("/profile");
    } else {
      toast({
        title: "Update Failed",
        description: "Could not update your profile. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }

  if (authLoading && !user) {
    return (
        <div className="flex justify-center items-center h-64">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  if (!user) {
    // This case should ideally be handled by a layout or higher-order component
    // redirecting to login if user is not authenticated.
    return <p className="text-center font-body">Please log in to edit your profile.</p>;
  }


  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-3xl text-primary">Edit Your Profile</CardTitle>
            <Button variant="ghost" size="icon" asChild>
                <Link href="/profile" aria-label="Back to profile">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
            </Button>
        </div>
        <CardDescription className="font-body">Update your personal information below.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-code">Full Name</FormLabel>
                  <FormControl>
                    <Input className="font-code" placeholder="e.g., Urdhva Sugganaboyina" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-code">Phone Number</FormLabel>
                  <FormControl>
                    <Input className="font-code" type="tel" placeholder="e.g., 7675801718" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div>
                <p className="font-code text-sm text-muted-foreground">Email (Cannot be changed)</p>
                <p className="font-body text-base mt-1 p-2 border rounded-md bg-muted/50">{user?.email}</p>
            </div>
             <div>
                <p className="font-code text-sm text-muted-foreground">Role (Cannot be changed)</p>
                <p className="font-body text-base mt-1 p-2 border rounded-md bg-muted/50 capitalize">{user?.role}</p>
            </div>

            <Button type="submit" className="w-full btn-gradient-primary font-code py-3 text-base" disabled={isLoading || authLoading}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" /> }
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
       <CardFooter className="mt-4">
        <Button variant="outline" className="w-full" asChild>
          <Link href="/profile">Cancel</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
