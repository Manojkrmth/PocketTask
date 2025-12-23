'use client';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// --- Dummy Data ---
const dummyPaymentHistory = [
    { id: 'pay1', userId: 'usr_1', user: { name: 'Aarav Sharma', email: 'aarav.sh@example.com'}, requestTime: new Date(), method: 'UPI', details: 'aarav@upi', amount: 500, status: 'Approved', utr: 'UTR12345' },
    { id: 'pay2', userId: 'usr_2', user: { name: 'Diya Mehta', email: 'diya.mehta@example.com'}, requestTime: new Date(Date.now() - 86400000), method: 'UPI', details: 'diya@upi', amount: 1200, status: 'Pending' },
    { id: 'pay3', userId: 'usr_3', user: { name: 'Ishaan Patel', email: 'ishaan.p@example.com'}, requestTime: new Date(Date.now() - 86400000*2), method: 'Bank', details: '1234567890', amount: 750, status: 'Rejected', reason: 'Invalid details' },
];
// --- End Dummy Data ---

export default function AdminPaymentHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = useMemo(() => {
    if (!searchTerm) return dummyPaymentHistory;
    const lowercasedFilter = searchTerm.toLowerCase();
    return dummyPaymentHistory.filter(req => 
        req.user.name.toLowerCase().includes(lowercasedFilter) ||
        req.user.email.toLowerCase().includes(lowercasedFilter) ||
        req.details.toLowerCase().includes(lowercasedFilter)
    );
  }, [searchTerm]);

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    return date.toLocaleString();
  }
  
  const getStatusBadge = (status: string) => {
      switch (status) {
          case 'Approved': return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
          case 'Pending': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
          case 'Rejected': return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
          default: return <Badge variant="secondary">{status}</Badge>;
      }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Payment History</h1>
      </div>

       <Card>
        <CardHeader>
           <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <CardTitle>All Requests</CardTitle>
             <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search by Email, UPI, Amount..." 
                    className="pl-10 h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method & Details</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium text-sm">
                    <div className="font-bold">{req.user.name}</div>
                    <div className="text-xs text-muted-foreground">{req.user.email}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(req.requestTime)}</TableCell>
                  <TableCell>
                    <div>{req.method} ({req.details})</div>
                     {req.utr && <div className="text-xs text-blue-500">UTR: {req.utr}</div>}
                     {req.reason && <div className="text-xs text-red-500">Reason: {req.reason}</div>}
                  </TableCell>
                  <TableCell className="font-bold">₹{req.amount.toLocaleString("en-IN")}</TableCell>
                  <TableCell>{getStatusBadge(req.status)}</TableCell>
                  <TableCell className="text-right space-x-2">
                     <Link href={`/cmadmin/users/${req.userId}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                        <Eye className="h-4 w-4" />
                     </Link>
                     {req.status === 'Pending' && (
                       <>
                         <Button size="sm" className="bg-green-500 hover:bg-green-600">Approve</Button>
                         <Button size="sm" variant="destructive">Reject</Button>
                       </>
                     )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
