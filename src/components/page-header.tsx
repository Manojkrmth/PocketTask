'use client';

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

interface PageHeaderProps {
    title: string;
    description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
    const router = useRouter();

    return (
        <header className="bg-primary/90 p-4 rounded-b-xl shadow-md sticky top-0 z-20 text-primary-foreground text-center">
            <div className="relative flex items-center justify-center h-full">
                <Button variant="ghost" size="icon" className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full text-primary-foreground hover:bg-white/20" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex flex-col items-center">
                    <h1 className="text-xl font-bold">{title}</h1>
                    {description && <p className="text-xs opacity-80">{description}</p>}
                </div>
            </div>
        </header>
    );
}
