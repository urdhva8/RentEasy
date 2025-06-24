
"use client";

import { PropertyList } from "@/components/properties/property-list";
import { useAuth } from "@/contexts/auth-context";
import { MOCK_PROPERTIES, saveMockProperties } from "@/lib/mock-data";
import type { Property } from "@/types";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function MyListingsPage() {
  const { user } = useAuth();
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Simulate fetching owner's properties
      const filteredProperties = MOCK_PROPERTIES.filter(p => p.ownerId === user.id);
      setMyProperties(filteredProperties);
    }
    setLoading(false);
  }, [user]);

  const handleDeleteProperty = (propertyId: string) => {
    // This would typically be an API call
    // For mock data, filter out the property
    const updatedProperties = MOCK_PROPERTIES.filter(p => p.id !== propertyId);
    
    // Update MOCK_PROPERTIES array
    MOCK_PROPERTIES.length = 0; // Clear array
    Array.prototype.push.apply(MOCK_PROPERTIES, updatedProperties); // Re-populate
    
    saveMockProperties(); // Persist changes to localStorage
    
    setMyProperties(prev => prev.filter(p => p.id !== propertyId));
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.role !== 'owner') {
    return <p className="text-center text-destructive font-body">Access denied. You must be an owner to view this page.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-headline font-bold text-primary">My Listed Properties</h1>
        <Button asChild className="btn-gradient-primary">
          <Link href="/properties/add">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Property
          </Link>
        </Button>
      </div>
      <PropertyList 
        properties={myProperties} 
        isOwnerView={true}
        onDeleteProperty={handleDeleteProperty}
      />
    </div>
  );
}
