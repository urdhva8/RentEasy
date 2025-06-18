"use client";

import { PropertyList } from "@/components/properties/property-list";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import type { Property } from "@/types";

export default function BrowsePropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setProperties(MOCK_PROPERTIES);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-headline font-bold text-primary">Available Properties</h1>
      <PropertyList properties={properties} />
    </div>
  );
}
