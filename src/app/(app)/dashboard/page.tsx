
"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { List, PlusCircle, MessageSquare } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { user, isOwner, isTenant } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-primary">Welcome to RentEasy, {user.name}!</CardTitle>
          <CardDescription className="font-body text-lg">Your rental journey starts here. You are logged in as a {user.role}.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-body">Explore available properties, manage your listings, or communicate with other users.</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isTenant && (
          <DashboardActionCard
            title="Browse Properties"
            description="Find your next home by browsing available rental listings."
            href="/properties"
            icon={List}
            actionText="View Properties"
          />
        )}
        {isOwner && (
          <DashboardActionCard
            title="My Listings"
            description="View and manage the properties you have listed for rent."
            href="/properties/my-listings"
            icon={List}
            actionText="View My Listings"
          />
        )}
        {isOwner && (
          <DashboardActionCard
            title="Add New Property"
            description="List a new property for rent and reach potential tenants."
            href="/properties/add"
            icon={PlusCircle}
            actionText="Add Property"
          />
        )}
         <DashboardActionCard
            title="Messages"
            description="Check your messages and communicate with tenants or owners."
            href="/chat"
            icon={MessageSquare}
            actionText="View Messages"
          />
      </div>
    </div>
  );
}

interface DashboardActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  actionText: string;
}

function DashboardActionCard({ title, description, href, icon: Icon, actionText }: DashboardActionCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center space-x-4 pb-2">
        <Icon className="h-10 w-10 text-primary" />
        <div>
          <CardTitle className="font-headline text-xl">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="font-body text-muted-foreground mb-4">{description}</p>
        <Button asChild className="w-full btn-gradient-primary">
          <Link href={href}>{actionText}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
