'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function UpdatePasswordPage() {
    const { toast } = useToast();
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdating, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleUpdatePassword = async () => {
        setError(null);

        if (password !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        startTransition(async () => {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                let friendlyError = "An error occurred. Please try again.";
                if (error.message.includes('weak')) {
                     friendlyError = "The new password is too weak.";
                }
                setError(friendlyError);
            } else {
                 toast({
                    title: "Password Updated",
                    description: "Your password has been changed successfully.",
                });
                router.push('/login');
            }
        });
    }

    return (
        <div>
            <PageHeader title="Update Password" />
            <main className="p-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Create a New Password</CardTitle>
                        <CardDescription>Enter and confirm your new password below. You will be redirected to login afterwards.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="new-password">New Password</Label>
                            <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isUpdating}/>
                        </div>
                         <div>
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isUpdating}/>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        
                        <Button className="w-full" onClick={handleUpdatePassword} disabled={isUpdating}>
                           {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                           {isUpdating ? 'Updating...' : 'Update Password'}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
