'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsAndConditionsPage() {
    return (
        <div>
            <PageHeader title="Terms & Conditions" />
            <main className="p-4 space-y-6 pb-24">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Agreement to Terms</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>By using our mobile application, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, you may not use the application. We may modify these terms at any time, and such modifications shall be effective immediately upon posting the modified terms.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>2. User Accounts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>You must be at least 18 years old to create an account. You are responsible for safeguarding your account and for any activities or actions under your account. You agree not to disclose your password to any third party. We reserve the right to suspend or terminate your account at any time for any reason, including any violation of these Terms.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>3. Tasks and Rewards</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>CookieMail provides tasks for users to complete in exchange for rewards. All task submissions are subject to verification and approval by our team. We reserve the right to reject any submission that does not meet our quality standards or violates our policies. Any fraudulent activity will result in immediate account termination and forfeiture of all earnings.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>4. Governing Law</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>5. Contact Us</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>If you have any questions about these Terms, please contact us at: <a href="mailto:manojmukhiyamth@gmail.com" className="text-primary hover:underline">manojmukhiyamth@gmail.com</a></p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
