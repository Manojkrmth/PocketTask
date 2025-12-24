'use client';

import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import React from "react";

interface CopyButtonProps extends ButtonProps {
    value: string;
}

export function CopyButton({ value, children, className, ...props }: CopyButtonProps) {
    const { toast } = useToast();

    const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault(); // prevent any parent action
        e.stopPropagation(); // stop event from bubbling up
        navigator.clipboard.writeText(value);
        toast({
            title: "Copied!",
            description: "The value has been copied to your clipboard.",
        });
    };

    return (
        <Button onClick={handleCopy} className={cn(className)} {...props}>
            {children}
        </Button>
    );
}
