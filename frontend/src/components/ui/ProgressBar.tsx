import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ProgressBarProps {
    value: number;
    max?: number;
    className?: string;
    indicatorClassName?: string;
    showLabel?: boolean;
}

export const ProgressBar = ({ value, max = 100, className, indicatorClassName, showLabel }: ProgressBarProps) => {
    const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

    return (
        <div className='w-full space-y-1'>
            <div className={cn('h-2 w-full bg-muted rounded-full overflow-hidden', className)}>
                <div
                    className={cn('h-full bg-primary transition-all duration-500 ease-out', indicatorClassName)}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <div className='flex justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-wider'>
                    <span>{percentage.toFixed(0)}%</span>
                    <span>{max}%</span>
                </div>
            )}
        </div>
    );
};
