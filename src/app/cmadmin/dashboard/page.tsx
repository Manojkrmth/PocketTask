'use client';

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Banknote,
  Clock,
  ListChecks,
  Shield,
  Users,
  Wallet,
  Eye,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

// --- Dummy Data ---
const dummyStats = {
  totalUsers: 1250,
  totalPaid: 50000,
  completedTasks: 8500,
  pendingTasks: 320,
  pendingPayments: 15,
  totalAdmins: 3,
};

const dummyTopUsers = [
  { id: 'user1', fullName: 'Ravi Kumar', email: 'ravi.k@example.com', mobile: '9876543210', referralCode: 'CMRAV123', balanceAvailable: 1500.75 },
  { id: 'user2', fullName: 'Sunita Sharma', email: 'sunita.sh@example.com', mobile: '9876543211', referralCode: 'CMSUN456', balanceAvailable: 1250.00 },
  { id: 'user3', fullName: 'Amit Patel', email: 'amit.p@example.com', mobile: '9876543212', referralCode: 'CMAMI789', balanceAvailable: 1100.50 },
  { id: 'user4', fullName: 'Priya Singh', email: 'priya.s@example.com', mobile: '9876543213', referralCode: 'CMPRI012', balanceAvailable: 950.00 },
  { id: 'user5', fullName: 'Vikram Rathore', email: 'vikram.r@example.com', mobile: '9876543214', referralCode: 'CMVIK345', balanceAvailable: 800.25 },
];
// --- End Dummy Data ---

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // 1.5 seconds delay
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, Super Admin!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Users</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : dummyStats.totalUsers}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Paid Amount</CardTitle>
            <Banknote className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : `₹${dummyStats.totalPaid.toLocaleString('en-IN')}`}</p>
          </CardContent>
        </Card>
        <Card className="bg-teal-50 border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-teal-800">Completed Tasks</CardTitle>
            <ListChecks className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-teal-900">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : dummyStats.completedTasks}</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Pending Tasks</CardTitle>
            <Clock className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-900">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : dummyStats.pendingTasks}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Pending Payments</CardTitle>
            <Wallet className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-900">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : dummyStats.pendingPayments}</p>
          </CardContent>
        </Card>
         <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-800">Total Admins</CardTitle>
            <Shield className="h-5 w-5 text-slate-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : dummyStats.totalAdmins}</p>
          </CardContent>
        </Card>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
            <Card>
                <CardHeader>
                <CardTitle>Top Users by Balance</CardTitle>
                <CardDescription>Your most active users.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>Referral Code</TableHead>
                        <TableHead>Available Balance</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {loading && <TableRow><TableCell colSpan={6} className="text-center h-24">Loading top users...</TableCell></TableRow>}
                    {!loading && dummyTopUsers.map((user) => (
                        <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.mobile}</TableCell>
                        <TableCell className="font-mono text-xs">{user.referralCode}</TableCell>
                        <TableCell className="font-bold text-green-600">₹{user.balanceAvailable?.toLocaleString('en-IN') || '0'}</TableCell>
                        <TableCell className="text-right">
                           <Link href={`/cmadmin/users/${user.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                                <Eye className="h-4 w-4 mr-2" /> View User
                            </Link>
                        </TableCell>
                        </TableRow>
                    ))}
                     {!loading && (!dummyTopUsers || dummyTopUsers.length === 0) && (
                        <TableRow><TableCell colSpan={6} className="text-center h-24">No users with balance found.</TableCell></TableRow>
                     )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
       </div>
    </div>
  );
}
