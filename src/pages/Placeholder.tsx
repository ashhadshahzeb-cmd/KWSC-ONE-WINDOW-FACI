import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hammer } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function Placeholder() {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const rawTitle = pathParts[pathParts.length - 1] || "Module";
  
  // Format title like 'supp-salary' -> 'Supp Salary'
  const title = rawTitle
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="space-y-6 animate-fade-in pb-10 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
        <Hammer className="w-8 h-8 text-primary animate-pulse" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold font-heading text-primary">{title}</h1>
        <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Under Construction</p>
      </div>
      
      <p className="text-muted-foreground max-w-md text-center text-sm">
        This module is currently in active development. Detailed entry forms, workflow processing, and database integrations will be available shortly.
      </p>
      
      <Card className="glass-card mt-8 w-full max-w-lg border-primary/20 bg-primary/5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 p-full h-full bg-primary/50" />
        <CardHeader>
          <CardTitle className="text-center text-sm italic">Expected Features Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm space-y-2 text-muted-foreground">
            <li>Dedicated data entry interface for {title} tracking</li>
            <li>Real-time calculations and automated value-to-words parsing</li>
            <li>Integrated link to Master Entries and Accounts Data</li>
            <li>Customized Crystal Reports generation format for records</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
