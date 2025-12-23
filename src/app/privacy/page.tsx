'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
    return (
        <div>
            <PageHeader title="Privacy Policy" />
            <main className="p-4 space-y-6 pb-24">
                <Card>
                    <CardHeader>
                        <CardTitle>Introduction</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>Welcome to CookieMail. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Collection of Your Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>We may collect information about you in a variety of ways. The information we may collect via the Application includes:</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and mobile number, that you voluntarily give to us when you register with the Application.</li>
                            <li><strong>Financial Data:</strong> Data related to your payment method (e.g., UPI ID) that we collect when you request a withdrawal.</li>
                            <li><strong>Data From Contests, Giveaways, and Surveys:</strong> Personal and other information you may provide when entering contests or giveaways and/or responding to surveys.</li>
                        </ul>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Use of Your Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to:</p>
                         <ul className="list-disc list-inside space-y-2">
                            <li>Create and manage your account.</li>
                            <li>Process payments and refunds.</li>
                            <li>Email you regarding your account or order.</li>
                            <li>Enable user-to-user communications.</li>
                            <li>Fulfill and manage tasks, payments, and other transactions.</li>
                        </ul>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Contact Us</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>If you have questions or comments about this Privacy Policy, please contact us at: <a href="mailto:manojmukhiyamth@gmail.com" className="text-primary hover:underline">manojmukhiyamth@gmail.com</a></p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
