'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UploadCloud, Download } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default function AdminPaymentsPage() {

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Manage Payments</h1>
             <Link href="/cmadmin/payments/history" className={cn(buttonVariants({ variant: 'outline' }))}>View Full History</Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Bulk Payment Processing</CardTitle>
            <CardDescription>Download pending requests as CSV or upload CSVs for bulk actions.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <Button variant="outline">
                <Download className="mr-2 h-4 w-4" /> Download Pending CSV
            </Button>
            <Button variant="outline"><UploadCloud className="mr-2 h-4 w-4" />Bulk Approve</Button>
            <Button variant="destructive"><UploadCloud className="mr-2 h-4 w-4" />Bulk Reject</Button>
          </CardContent>
        </Card>
    </div>
  );
}
