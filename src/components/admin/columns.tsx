'use client';

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Eye, Edit, Ban, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { cn } from "@/lib/utils"

export type User = {
  id: string
  fullName: string
  email: string
  mobile: string
  referralCode: string
  referredBy?: string
  balanceAvailable: number
  balanceHold: number
  status: "Active" | "Blocked"
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "fullName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Full Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
     cell: ({ row }) => {
        const user = row.original
        return (
            <div className="flex flex-col">
                <span className="font-medium">{user.fullName}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
        )
    }
  },
  {
    accessorKey: "mobile",
    header: "Mobile",
  },
  {
    accessorKey: "referralCode",
    header: "Referral Code",
  },
  {
    accessorKey: "balanceAvailable",
    header: ({ column }) => {
       return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Balance (Avl)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("balanceAvailable"))
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount)
 
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <Badge variant={status === 'Active' ? 'default' : 'destructive'} className={cn(status === 'Active' && "bg-green-500")}>{status}</Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original
 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
                <Link href={`/cmadmin/users/${user.id}`}><Eye className="mr-2 h-4 w-4" />View Details</Link>
            </DropdownMenuItem>
             <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Edit User</DropdownMenuItem>
            <DropdownMenuSeparator />
            {user.status === 'Active' ? (
                <DropdownMenuItem className="text-red-600 focus:text-red-600">
                    <Ban className="mr-2 h-4 w-4" />Block User
                </DropdownMenuItem>
            ) : (
                 <DropdownMenuItem className="text-green-600 focus:text-green-600">
                    <CheckCircle className="mr-2 h-4 w-4" />Unblock User
                </DropdownMenuItem>
            )}

          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
