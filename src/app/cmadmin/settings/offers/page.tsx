
'use client';

import { useEffect, useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Trash2, Edit, Link as LinkIcon, Image as ImageIcon, Text as TextIcon, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface Offer {
    id: number;
    created_at: string;
    image_url: string;
    description: string;
    redirect_link: string;
    enabled: boolean;
    sort_order: number;
}

export default function OffersSettingsPage() {
    const { toast } = useToast();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, startSubmitting] = useTransition();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<Partial<Offer> | null>(null);

    const fetchOffers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('featured_offers')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch offers. ' + error.message });
        } else {
            setOffers(data as Offer[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOffers();
    }, [toast]);

    const handleAddNewClick = () => {
        setEditingOffer({ image_url: '', description: '', redirect_link: '', enabled: true, sort_order: (offers.length + 1) * 10 });
        setDialogOpen(true);
    };

    const handleEditClick = (offer: Offer) => {
        setEditingOffer(offer);
        setDialogOpen(true);
    };

    const handleDelete = async (offerId: number) => {
        if (!window.confirm('Are you sure you want to delete this offer?')) return;
        
        startSubmitting(async () => {
             const { error } = await supabase.from('featured_offers').delete().eq('id', offerId);
             if (error) {
                 toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
             } else {
                 toast({ title: 'Success', description: 'Offer has been deleted.' });
                 await fetchOffers();
             }
        });
    };

    const handleSaveOffer = async () => {
        if (!editingOffer || !editingOffer.image_url) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Image URL is required.' });
            return;
        }

        startSubmitting(async () => {
            const { error } = await supabase.from('featured_offers').upsert({
                id: editingOffer.id,
                image_url: editingOffer.image_url,
                description: editingOffer.description,
                redirect_link: editingOffer.redirect_link,
                enabled: editingOffer.enabled,
                sort_order: editingOffer.sort_order,
            });

            if (error) {
                 toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
            } else {
                 toast({ title: 'Success', description: 'Offer has been saved.' });
                 setDialogOpen(false);
                 await fetchOffers();
            }
        });
    };
    
    const handleToggleEnabled = async (offer: Offer) => {
         startSubmitting(async () => {
             const { error } = await supabase
                .from('featured_offers')
                .update({ enabled: !offer.enabled })
                .eq('id', offer.id);
            
            if (error) {
                 toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
            } else {
                 toast({ title: 'Success', description: `Offer is now ${!offer.enabled ? 'enabled' : 'disabled'}.` });
                 await fetchOffers();
            }
        });
    }

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Featured Offers</h1>
                    <p className="text-muted-foreground">Manage the promotional offers on the home page carousel.</p>
                </div>

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
                                    {offer.image_url ? (
                                        <Image src={offer.image_url} alt={offer.description || ''} width={105} height={45} className="rounded-md object-cover aspect-[21/9] bg-muted" />
                                    ) : (
                                        <div className="w-[105px] h-[45px] flex items-center justify-center bg-muted rounded-md text-muted-foreground">
                                            <ImageIcon className="h-6 w-6" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="font-semibold">{offer.description || 'No description'}</p>
                                        <p className="text-xs text-muted-foreground truncate">{offer.redirect_link || 'No link'}</p>
                                        <Badge variant={offer.enabled ? "default" : "secondary"} className={cn("mt-1", offer.enabled && "bg-green-500")}>
                                            {offer.enabled ? 'Enabled' : 'Disabled'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch checked={offer.enabled} onCheckedChange={() => handleToggleEnabled(offer)} disabled={isSubmitting} />
                                        <Button variant="outline" size="icon" onClick={() => handleEditClick(offer)} disabled={isSubmitting}><Edit className="h-4 w-4"/></Button>
                                        <Button variant="destructive" size="icon" onClick={() => handleDelete(offer.id)} disabled={isSubmitting}><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-10">No offers have been added yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setEditingOffer(null); setDialogOpen(open);}}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingOffer?.id ? 'Edit Offer' : 'Add New Offer'}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                       <div className="space-y-2">
                            <Label htmlFor="image_url" className="flex items-center gap-2"><ImageIcon/> Image URL</Label>
                            <Input id="image_url" value={editingOffer?.image_url || ''} onChange={e => setEditingOffer({...editingOffer, image_url: e.target.value})} placeholder="https://example.com/image.png" disabled={isSubmitting} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="description" className="flex items-center gap-2"><TextIcon/> Description (Optional)</Label>
                            <Input id="description" value={editingOffer?.description || ''} onChange={e => setEditingOffer({...editingOffer, description: e.target.value})} placeholder="e.g., Summer Sale" disabled={isSubmitting} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="redirect_link" className="flex items-center gap-2"><LinkIcon/> Redirect Link (Optional)</Label>
                            <Input id="redirect_link" value={editingOffer?.redirect_link || ''} onChange={e => setEditingOffer({...editingOffer, redirect_link: e.target.value})} placeholder="https://example.com/offer" disabled={isSubmitting} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sort_order">Sort Order</Label>
                            <Input id="sort_order" type="number" value={editingOffer?.sort_order || 0} onChange={e => setEditingOffer({...editingOffer, sort_order: parseInt(e.target.value) || 0})} placeholder="e.g., 10, 20" disabled={isSubmitting} />
                        </div>
                         <div className="flex items-center space-x-2">
                            <Switch id="enabled" checked={editingOffer?.enabled ?? true} onCheckedChange={checked => setEditingOffer({...editingOffer, enabled: checked })} disabled={isSubmitting} />
                            <Label htmlFor="enabled">Enabled</Label>
                        </div>
                    </div>
                    <DialogFooter>
                         <DialogClose asChild>
                            <Button variant="ghost" disabled={isSubmitting}>Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleSaveOffer} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                            Save Offer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
