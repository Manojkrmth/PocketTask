
'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { supabase } from '@/lib/supabase';
import { Megaphone } from 'lucide-react';
import Image from 'next/image';
import { Card } from '../ui/card';
import { useInView } from 'react-intersection-observer';

interface AdConfig {
    id: string;
    name: string;
    isEnabled: boolean;
    script: {
        key: string;
        format: 'iframe';
        height: number;
        width: number;
        invokeJs: string;
    };
    customAd: {
        imageUrl: string;
        text: string;
        externalLink: string;
    };
}

interface BannerAdProps {
    adId: string;
}

const AdPlaceholder: React.FC = () => {
    return (
        <div className="h-[50px] w-[320px] bg-muted/50 rounded-md flex items-center justify-center text-muted-foreground text-sm">
            <Megaphone className="h-4 w-4 mr-2"/> Ad Loading...
        </div>
    )
}

const CustomAd: React.FC<{ config: AdConfig['customAd']}> = ({ config }) => {
    if (!config.imageUrl) {
        return (
             <div className="h-[50px] w-[320px] bg-muted rounded-md flex items-center justify-center text-muted-foreground text-sm">
                Custom Ad
            </div>
        );
    }
    
    const adContent = (
        <Card className="w-[320px] h-[50px] overflow-hidden relative group">
            <Image
                src={config.imageUrl}
                alt={config.text || 'Advertisement'}
                fill
                className="object-cover"
            />
            {config.text && (
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs text-center font-bold">{config.text}</p>
                 </div>
            )}
        </Card>
    );

    if (config.externalLink) {
        return (
            <a href={config.externalLink} target="_blank" rel="noopener noreferrer">
                {adContent}
            </a>
        );
    }

    return adContent;
}

const ScriptAd: React.FC<{ config: AdConfig['script']}> = memo(function ScriptAd({ config }) {
    const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
    const adLoadedRef = useRef(false);

    useEffect(() => {
        if (!inView || !config.key || !config.invokeJs || adLoadedRef.current) return;

        adLoadedRef.current = true;
        const adContainer = ref.current;
        if (!adContainer) return;

        try {
            const atOptionsScript = document.createElement('script');
            atOptionsScript.type = 'text/javascript';
            atOptionsScript.innerHTML = `
              var atOptions = {
                'key' : '${config.key}',
                'format' : '${config.format}',
                'height' : ${config.height},
                'width' : ${config.width},
                'params' : {}
              };
            `;
            
            const invokeScript = document.createElement('script');
            invokeScript.type = 'text/javascript';
            invokeScript.src = config.invokeJs;
            invokeScript.async = true;

            adContainer.appendChild(atOptionsScript);
            adContainer.appendChild(invokeScript);
        } catch (e) {
            console.error('Ad script injection failed:', e);
        }

        return () => {
            if (adContainer) {
                adContainer.innerHTML = '';
            }
        };
    }, [config, inView, ref]);
    
    if (!config.key || !config.invokeJs) return null;

    return <div ref={ref} style={{ width: `${config.width}px`, height: `${config.height}px` }}></div>;
});


const BannerAd: React.FC<BannerAdProps> = ({ adId }) => {
    const [adConfig, setAdConfig] = useState<AdConfig | null>(null);
    const [areAdsGloballyEnabled, setAreAdsGloballyEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAdConfig = async () => {
            try {
                const { data, error } = await supabase
                    .from('settings')
                    .select('ad_configs, are_ads_globally_enabled')
                    .eq('id', 1)
                    .single();

                if (error) throw error;

                if (data) {
                    setAreAdsGloballyEnabled(data.are_ads_globally_enabled ?? true);
                    
                    if (data.ad_configs) {
                        const config = (data.ad_configs as AdConfig[]).find(ad => ad.id === adId);
                        if (config) {
                            setAdConfig(config);
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to fetch ad config:", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAdConfig();
    }, [adId]);

    if (isLoading) {
        return <AdPlaceholder />;
    }

    if (!areAdsGloballyEnabled || !adConfig || !adConfig.isEnabled) {
        return null;
    }
    
    const hasScriptAd = adConfig.script?.key && adConfig.script?.invokeJs;

    return (
        <div className="flex justify-center my-4 relative border p-1 rounded-md bg-muted/30 w-max mx-auto">
           <div className="absolute top-0 right-0 -translate-y-1/2 bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full border">
                Ad
           </div>
           {hasScriptAd ? <ScriptAd config={adConfig.script} /> : <CustomAd config={adConfig.customAd} />}
        </div>
    );
};

export default BannerAd;
