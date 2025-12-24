'use client';

export default function AdminDashboardPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome Super Admin!</p>
        </div>
      </div>
       <div className="mt-8">
        <p>This is your central hub for managing the application.</p>
       </div>
    </div>
  );
}
