'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/context/currency-context';
import type { Currency } from '@/context/currency-context';
import { PageHeader } from '@/components/page-header';
import BannerAd from '@/components/ads/banner-ad';

export default function CurrencyPage() {
  const { currency, setCurrency, usdToInrRate } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency);
  const { toast } = useToast();
  const router = useRouter();

  const USDT_RATE = usdToInrRate;

  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

  const handleSave = () => {
    setCurrency(selectedCurrency);
    toast({
      title: 'Currency Updated',
      description: `Your preferred currency has been set to ${selectedCurrency.toUpperCase()}.`,
    });
    router.back();
  };

  return (
    <div>
      <PageHeader
        title="Currency"
        description="Choose your preferred currency"
      />
      <main className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Your Currency</CardTitle>
            <CardDescription>
              Choose the currency you want to see in the app. The exchange rate
              is fixed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={selectedCurrency}
              onValueChange={(value) => setSelectedCurrency(value as Currency)}
              className="space-y-4"
            >
              <Label
                htmlFor="inr"
                className="flex items-center space-x-4 p-4 border rounded-md cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"
              >
                <RadioGroupItem value="INR" id="inr" />
                <div className="flex-1">
                  <p className="font-bold">Indian Rupee (INR)</p>
                  <p className="text-sm text-muted-foreground">
                    Default currency.
                  </p>
                </div>
              </Label>
              <Label
                htmlFor="usd"
                className="flex items-center space-x-4 p-4 border rounded-md cursor-pointer has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"
              >
                <RadioGroupItem value="USD" id="usd" />
                <div className="flex-1">
                  <p className="font-bold">US Dollar (USD)</p>
                  <p className="text-sm text-muted-foreground">
                    Rate: 1 USD = ₹{USDT_RATE}
                  </p>
                </div>
              </Label>
            </RadioGroup>
            <Button onClick={handleSave} className="w-full">
              Save Preference
            </Button>
          </CardContent>
        </Card>
        <BannerAd adId="currency" />
      </main>
    </div>
  );
}
