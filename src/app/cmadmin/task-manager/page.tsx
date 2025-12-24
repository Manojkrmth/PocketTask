
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Construction } from 'lucide-react';

export default function TaskManagerPage() {
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold">Task Manager</h1>
            <p className="text-muted-foreground">
              This page is under construction.
            </p>
        </div>
        <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Construction className="w-16 h-16 text-primary mb-4" />
            <CardHeader>
                <CardTitle>Under Construction</CardTitle>
                <CardDescription>
                    This feature is currently being built. Please check back later.
                </CardDescription>
            </CardHeader>
        </Card>
    </div>
  );
}
