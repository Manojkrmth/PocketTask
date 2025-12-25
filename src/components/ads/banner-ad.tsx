
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Megaphone } from 'lucide-react';
import Image from 'next/image';
import { Card } from '../ui/card';

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

const ScriptAd: React.FC<{ config: AdConfig['script']}> = ({ config }) => {
    const adContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!config.key || !config.invokeJs) return;

        if (adContainerRef.current && adContainerRef.current.children.length === 0) {
            
            const atOptionsScript = document.createElement('script');
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
            invokeScript.src = config.invokeJs;
            invokeScript.async = true;

            adContainerRef.current.appendChild(atOptionsScript);
            adContainerRef.current.appendChild(invokeScript);
        }

        return () => {
            if (adContainerRef.current) {
                adContainerRef.current.innerHTML = '';
            }
        };
    }, [config]);
    
    if (!config.key || !config.invokeJs) return null;

    return <div ref={adContainerRef} style={{ width: `${config.width}px`, height: `${config.height}px` }}></div>;
};


const BannerAd: React.FC<BannerAdProps> = ({ adId }) => {
    const [adConfig, setAdConfig] = useState<AdConfig | null>(null);
    const [areAdsGloballyEnabled, setAreAdsGloballyEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAdConfig = async () => {
            const { data, error } = await supabase
                .from('settings')
                .select('settings_data')
                .eq('id', 1)
                .single();

            if (!error && data && data.settings_data) {
                const settings = data.settings_data;
                setAreAdsGloballyEnabled(settings.areAdsGloballyEnabled ?? true);
                
                if (settings.ads) {
                    const config = (settings.ads as AdConfig[]).find(ad => ad.id === adId);
                    if (config) {
                        setAdConfig(config);
                    }
                }
            }
            setIsLoading(false);
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

    