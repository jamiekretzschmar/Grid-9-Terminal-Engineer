
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        manifest: "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20",
        govern: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20",
        banish: "bg-slate-800 text-slate-400 border-2 border-slate-700 hover:bg-red-900/20 hover:text-red-500 hover:border-red-900/50",
        ghost: "bg-transparent text-slate-400 hover:text-emerald-400 hover:bg-slate-900/50",
      },
      size: {
        sm: "px-4 py-2 text-[10px]",
        md: "px-6 py-3 text-xs",
        lg: "px-8 py-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "manifest",
      size: "md",
    },
  }
);

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const SovereignButton: React.FC<ButtonProps> = ({ className, variant, size, ...props }) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
};

export default SovereignButton;
