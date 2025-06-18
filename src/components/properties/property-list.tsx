
"use client";

import type { Property } from "@/types";
import { PropertyCard } from "./property-card";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";

interface PropertyListProps {
  properties: Property[];
  isOwnerView?: boolean;
  onDeleteProperty?: (propertyId: string) => void;
}

export function PropertyList({ properties, isOwnerView = false, onDeleteProperty }: PropertyListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProperties = useMemo(() => {
    if (!searchTerm) return properties;
    return properties.filter(
      (property) =>
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [properties, searchTerm]);

  if (!properties || properties.length === 0) {
    return <p className="text-center text-muted-foreground font-body py-10">
      {isOwnerView ? "You haven't listed any properties yet." : "No properties available at the moment. Please check back later."}
    </p>;
  }

  return (
    <div className="space-y-6">
      {!isOwnerView && (
         <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search properties by name, address, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border shadow-sm font-code"
          />
        </div>
      )}
      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProperties.map((property) => (
            <PropertyCard 
              key={property.id} 
              property={property} 
              isOwnerView={isOwnerView} 
              onDelete={onDeleteProperty}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground font-body py-10">
          No properties match your search criteria.
        </p>
      )}
    </div>
  );
}
