'use client';

import { useEffect, useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Gift, PlusCircle, Trash2, Edit, Link as LinkIcon, Image as ImageIcon, Text as TextIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Offer {
    id: string;
    imageUrl: string;
    description: string;
    redirectLink: string;
    enabled: boolean;
}

export default function OffersSettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<any>(null);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, startSaving] = useTransition();

    // State for new/editing offer
    const [editOffer, setEditOffer] = useState<Partial<Offer> | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('settings')
                .select('settings_data')
                .eq('id', 1)
                .single();

            if (error) {
                console.error('Error fetching settings:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch app settings.' });
            } else {
                setSettings(data.settings_data);
                const fetchedOffers = data.settings_data.featuredOffers || [];
                // Ensure backward compatibility by adding `enabled: true` if it's missing
                const updatedOffers = fetchedOffers.map((offer: Offer) => ({ ...offer, enabled: offer.enabled ?? true }));
                setOffers(updatedOffers);
            }
            setLoading(false);
        };
        fetchSettings();
    }, [toast]);

    const handleSaveChanges = () => {
        startSaving(async () => {
            const updatedSettings = {
                ...settings,
                featuredOffers: offers,
            };
            
            setSettings(updatedSettings); // Update local settings state before saving

            const { error } = await supabase
                .from('settings')
                .update({ settings_data: updatedSettings })
                .eq('id', 1);

            if (error) {
                toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
            } else {
                toast({ title: 'Success', description: 'Featured offers have been updated.' });
            }
        });
    };

    const handleAddNewClick = () => {
        setEditOffer({ id: `offer_${Date.now()}`, imageUrl: '', description: '', redirectLink: '', enabled: true });
    };
    
    const handleOfferEnabledChange = (offerId: string, checked: boolean) => {
        setOffers(prev => prev.map(o => o.id === offerId ? { ...o, enabled: checked } : o));
    };

    const handleEditClick = (offer: Offer) => {
        setEditOffer(offer);
    };

    const handleDelete = (offerId: string) => {
        setOffers(prev => prev.filter(o => o.id !== offerId));
    };

    const handleSaveOffer = () => {
        if (!editOffer || !editOffer.imageUrl) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Image URL is required.' });
            return;
        }

        const existingIndex = offers.findIndex(o => o.id === editOffer.id);
        if (existingIndex > -1) {
            // Update existing
            const updatedOffers = [...offers];
            updatedOffers[existingIndex] = editOffer as Offer;
            setOffers(updatedOffers);
        } else {
            // Add new
            setOffers(prev => [...prev, editOffer as Offer]);
        }
        setEditOffer(null);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Featured Offers</h1>
                <p className="text-muted-foreground">Manage the promotional offers on the home page carousel.</p>
            </div>

            {!editOffer ? (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Current Offers</CardTitle>
                            <CardDescription>A list of offers currently in the carousel.</CardDescription>
                        </div>
                        <Button onClick={handleAddNewClick}><PlusCircle className="mr-2 h-4 w-4"/> Add New Offer</Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {offers.length > 0 ? (
                            offers.map(offer => (
                                <div key={offer.id} className="flex items-center gap-4 border p-2 rounded-lg">
                                    <Image src={offer.imageUrl} alt={offer.description} width={105} height={45} className="rounded-md object-cover aspect-[21/9] bg-muted" />
                                    <div className="flex-1">
                                        <p className="font-semibold">{offer.description || 'No description'}</p>
                                        <p className="text-xs text-muted-foreground truncate">{offer.redirectLink || 'No link'}</p>
                                        <Badge variant={offer.enabled ? "default" : "secondary"} className={cn("mt-1", offer.enabled && "bg-green-500")}>
                                            {offer.enabled ? 'Enabled' : 'Disabled'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch checked={offer.enabled} onCheckedChange={(checked) => handleOfferEnabledChange(offer.id, checked)} />
                                        <Button variant="outline" size="icon" onClick={() => handleEditClick(offer)}><Edit className="h-4 w-4"/></Button>
                                        <Button variant="destructive" size="icon" onClick={() => handleDelete(offer.id)}><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-10">No offers have been added yet.</p>
                        )}
                    </CardContent>
                </Card>
            ) : (
                 <Card>
                    <CardHeader>
                        <CardTitle>{offers.some(o => o.id === editOffer.id) ? 'Edit Offer' : 'Add New Offer'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl" className="flex items-center gap-2"><ImageIcon/> Image URL</Label>
                            <Input id="imageUrl" value={editOffer.imageUrl || ''} onChange={e => setEditOffer({...editOffer, imageUrl: e.target.value})} placeholder="https://example.com/image.png" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="description" className="flex items-center gap-2"><TextIcon/> Description (Optional)</Label>
                            <Input id="description" value={editOffer.description || ''} onChange={e => setEditOffer({...editOffer, description: e.target.value})} placeholder="e.g., Summer Sale" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="redirectLink" className="flex items-center gap-2"><LinkIcon/> Redirect Link (Optional)</Label>
                            <Input id="redirectLink" value={editOffer.redirectLink || ''} onChange={e => setEditOffer({...editOffer, redirectLink: e.target.value})} placeholder="https://example.com/offer" />
                        </div>
                         <div className="flex items-center space-x-2">
                            <Switch id="enabled" checked={editOffer.enabled ?? true} onCheckedChange={checked => setEditOffer({...editOffer, enabled: checked })} />
                            <Label htmlFor="enabled">Enabled</Label>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setEditOffer(null)}>Cancel</Button>
                            <Button onClick={handleSaveOffer}>Save Offer</Button>
                        </div>
                    </CardContent>
                 </Card>
            )}

            <div className="flex justify-end gap-2">
                <Button onClick={handleSaveChanges} disabled={isSaving || loading || !!editOffer}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save All Changes to Carousel
                </Button>
            </div>
        </div>
    );
}
