'use client';

interface PageHeaderProps {
    title: string;
    description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
    return (
        <header className="bg-primary/90 p-4 rounded-b-xl shadow-md sticky top-0 z-20 text-primary-foreground text-center">
            <div className="relative flex items-center justify-center h-full">
                <div className="flex flex-col items-center">
                    <h1 className="text-xl font-bold">{title}</h1>
                    <p className="text-xs opacity-80">{description}</p>
                </div>
            </div>
        </header>
    );
}
