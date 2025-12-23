'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function DisclaimerPage() {
    return (
        <div>
            <PageHeader title="Disclaimer" />
            <main className="p-4 space-y-6 pb-24">
                <Card>
                    <CardHeader>
                        <CardTitle>General Disclaimer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                       <p>The information provided by CookieMail ("we," "us," or "our") on our mobile application is for general informational purposes only. All information on the application is provided in good faith, however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the application.</p>
                       <p>Under no circumstance shall we have any liability to you for any loss or damage of any kind incurred as a result of the use of the site or our mobile application or reliance on any information provided on the site and our mobile application. Your use of the site and our mobile application and your reliance on any information on these platforms is solely at your own risk.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Earnings Disclaimer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>CookieMail provides a platform for users to earn rewards by completing tasks. The amount of earnings can vary based on the number of tasks completed, the rewards associated with each task, and referral activities. We make no guarantees concerning the level of success you may experience. Any testimonials and examples used are exceptional results, which do not apply to the average purchaser and are not intended to represent or guarantee that anyone will achieve the same or similar results.</p>
                        <p>The use of our information, products, and services should be based on your own due diligence and you agree that CookieMail is not liable for any success or failure of your earnings that is directly or indirectly related to the purchase and use of our information, products, and services.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Contact Us</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-muted-foreground">
                        <p>If you have any questions about this Disclaimer, you can contact us by email: <a href="mailto:manojmukhiyamth@gmail.com" className="text-primary hover:underline">manojmukhiyamth@gmail.com</a></p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
