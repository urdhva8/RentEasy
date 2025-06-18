
"use client";

import type { Property } from "@/types";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MapPin, MessageSquare, Edit3, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getOrCreateChatConversation } from "@/lib/mock-data";
import { useRouter } from "next/navigation";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useToast } from "@/hooks/use-toast";

interface PropertyCardProps {
  property: Property;
  isOwnerView?: boolean;
  onDelete?: (propertyId: string) => void;
}

export function PropertyCard({ property, isOwnerView = false, onDelete }: PropertyCardProps) {
  const { user, isTenant } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleContactOwner = () => {
    if (user && isTenant) {
      const conversation = getOrCreateChatConversation(
        property.id, 
        user.id, 
        property.name, 
        user.name, 
        property.ownerId, 
        property.ownerName
      );
      router.push(`/chat/${conversation.id}`);
    } else if (!user) {
      router.push('/login');
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(property.id);
      toast({
        title: "Property Deleted",
        description: `"${property.name}" has been removed.`,
      });
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
      <CardHeader className="p-0">
        {property.images && property.images.length > 0 ? (
          <Carousel className="w-full">
            <CarouselContent>
              {property.images.map((img, index) => (
                <CarouselItem key={index}>
                  <div className="relative aspect-video w-full">
                    <Image
                      src={img.startsWith('data:') ? img : `https://placehold.co/600x400.png?text=Property+Image+${index+1}`}
                      alt={`${property.name} - Image ${index + 1}`}
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {property.images.length > 1 && (
              <>
                <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
              </>
            )}
          </Carousel>
        ) : (
          <div className="relative aspect-video w-full bg-muted flex items-center justify-center">
             <Image
                src="https://placehold.co/600x400.png?text=No+Image"
                alt="No image available"
                layout="fill"
                objectFit="cover"
              />
          </div>
        )}
         <div className="p-4 pb-1">
          <CardTitle className="font-headline text-xl mb-1">{property.name}</CardTitle>
          <CardDescription className="font-body flex items-center text-muted-foreground text-sm">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" /> {property.address}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0">
        <div className="flex items-center text-md font-semibold text-primary mb-2">
          <span className="mr-1">₹</span>{property.price.toLocaleString()}/month
        </div>
        <p className="font-body text-sm text-foreground line-clamp-2">{property.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {isOwnerView && user?.id === property.ownerId ? (
          <div className="flex w-full gap-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/properties/edit/${property.id}`}>
                <Edit3 className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
            <Button variant="destructive" size="sm" className="flex-1" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        ) : (
          <Button onClick={handleContactOwner} size="sm" className="w-full btn-accent font-code">
            <MessageSquare className="mr-2 h-4 w-4" /> Contact Owner
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
