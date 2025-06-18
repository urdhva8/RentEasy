
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Send } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const { toast } = useToast();

  const handleSendQuery = () => {
    if (query.trim() === "") {
      toast({
        title: "Query Empty",
        description: "Please describe your query before sending.",
        variant: "destructive",
      });
      return;
    }

    const recipientEmail = "urdhva.suggana@gmail.com";
    const subject = "Help Query from RentEasy User";
    const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(query)}`;
    
    try {
        window.location.href = mailtoLink;
        toast({
            title: "Query Prepared",
            description: "Your email client should open with your query. Please send it from there.",
            variant: "default"
        });
        setQuery(""); 
    } catch (error) {
        console.error("Failed to open mailto link:", error);
        toast({
            title: "Could Not Open Email Client",
            description: "We couldn't automatically open your email client. Please manually send your query to " + recipientEmail,
            variant: "destructive",
        });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-primary">Need Help?</CardTitle>
          <CardDescription className="font-body">
            Describe your query or issue below. Clicking &quot;Send Query via Email&quot; will attempt to open your default email client 
            to send your message to our support team at <strong className="font-semibold text-primary/90">{`urdhva.suggana@gmail.com`}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="query" className="font-code text-lg">Your Query</Label>
            <Textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Please provide as much detail as possible..."
              className="min-h-[150px] font-code mt-2"
              aria-label="Describe your query"
            />
          </div>
          <Button onClick={handleSendQuery} className="w-full btn-gradient-primary font-code text-base py-3">
            <Send className="mr-2 h-5 w-5" />
            Send Query via Email
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
