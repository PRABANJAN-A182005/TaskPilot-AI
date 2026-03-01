import { HTMLAttributes, ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export const Card = ({ className, children, ...props }: CardProps) => (
    <div
        className={cn(
            'bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden',
            className
        )}
        {...props}
    >
        {children}
    </div>
);

export const CardHeader = ({ className, children, ...props }: CardProps) => (
    <div
        className={cn('px-6 py-4 border-b border-border/50', className)}
        {...props}
    >
        {children}
    </div>
);

export const CardContent = ({ className, children, ...props }: CardProps) => (
    <div
        className={cn('px-6 py-4', className)}
        {...props}
    >
        {children}
    </div>
);

export const CardFooter = ({ className, children, ...props }: CardProps) => (
    <div
        className={cn('px-6 py-4 bg-muted border-t border-border/50', className)}
        {...props}
    >
        {children}
    </div>
);
