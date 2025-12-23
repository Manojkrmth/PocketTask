'use client';

import { DataTable } from "@/components/admin/data-table"
import { columns, User } from "@/components/admin/columns"

// Dummy data for user list
const dummyUsers: User[] = [
  { id: 'usr_1', fullName: 'Aarav Sharma', email: 'aarav.sh@example.com', mobile: '9123456780', referralCode: 'CMAAR12', referredBy: 'CMVIK345', balanceAvailable: 75.50, balanceHold: 20.00, status: 'Active' },
  { id: 'usr_2', fullName: 'Diya Mehta', email: 'diya.mehta@example.com', mobile: '9123456781', referralCode: 'CMDIY45', referredBy: 'CMRAV123', balanceAvailable: 120.00, balanceHold: 0, status: 'Active' },
  { id: 'usr_3', fullName: 'Ishaan Patel', email: 'ishaan.p@example.com', mobile: '9123456782', referralCode: 'CMISH78', referredBy: 'CMSUN456', balanceAvailable: 35.25, balanceHold: 15.00, status: 'Blocked' },
  { id: 'usr_4', fullName: 'Kavya Singh', email: 'kavya.s@example.com', mobile: '9123456783', referralCode: 'CMKAV01', referredBy: 'CMRAV123', balanceAvailable: 250.00, balanceHold: 50.00, status: 'Active' },
  { id: 'usr_5', fullName: 'Rohan Gupta', email: 'rohan.g@example.com', mobile: '9123456784', referralCode: 'CMROH34', referredBy: '', balanceAvailable: 0.00, balanceHold: 5.00, status: 'Active' },
];


export default function AdminUsersPage() {

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">App Users</h1>
      </div>
      <DataTable columns={columns} data={dummyUsers} isLoading={false} />
    </div>
  )
}
