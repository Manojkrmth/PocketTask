'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  ClipboardList,
  Wallet,
  IndianRupee,
  Activity,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Dummy data for stats
const stats = {
  totalUsers: 1256,
  pendingTasks: 89,
  totalWithdrawals: 52300,
  totalEarnings: 125000,
};

// Dummy data for recent users
const recentUsers = [
  { name: 'Ravi Kumar', email: 'ravi@example.com', joined: '2 hours ago' },
  { name: 'Priya Sharma', email: 'priya@example.com', joined: '5 hours ago' },
  {
    name: 'Amit Singh',
    email: 'amit.singh@example.com',
    joined: '1 day ago',
  },
  { name: 'Sneha Patel', email: 'sneha@example.com', joined: '1 day ago' },
];

// Dummy data for pending tasks
const pendingTasks = [
  {
    user: 'Ravi Kumar',
    taskType: 'Gmail Creation',
    reward: 10,
    submitted: '30 mins ago',
  },
  {
    user: 'Priya Sharma',
    taskType: 'Instagram Follow',
    reward: 5,
    submitted: '1 hour ago',
  },
  {
    user: 'Vikram Reddy',
    taskType: 'Used Mails (Bulk)',
    reward: 50,
    submitted: '2 hours ago',
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">+201 since last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              Needs verification
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Withdrawals
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalWithdrawals.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">
              +19% since last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Platform Earnings
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalEarnings.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">+5% from tasks</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Recent Registrations
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/cmadmin/users">View All</Link>
              </Button>
            </CardTitle>
            <CardDescription>
              New users who joined recently.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.email}>
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{user.joined}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Pending Task Submissions
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/cmadmin/tasks">View All</Link>
              </Button>
            </CardTitle>
            <CardDescription>
              Tasks awaiting your approval or rejection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User & Task</TableHead>
                  <TableHead className="text-right">Reward</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTasks.map((task, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="font-medium">{task.user}</div>
                      <div className="text-sm text-muted-foreground">
                        {task.taskType} -{' '}
                        <span className="text-xs">{task.submitted}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      ₹{task.reward}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
