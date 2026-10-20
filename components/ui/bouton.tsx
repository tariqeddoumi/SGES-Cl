import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const variantesBouton = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variante: {
        primaire: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        danger: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        contour: "border border-input bg-card shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondaire: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        fantome: "hover:bg-accent hover:text-accent-foreground",
        lien: "text-primary underline-offset-4 hover:underline",
      },
      taille: {
        normale: "h-9 px-4 py-2",
        petite: "h-8 px-3 text-xs",
        grande: "h-10 px-6",
        icone: "h-9 w-9",
        iconePetite: "h-7 w-7",
      },
    },
    defaultVariants: { variante: "primaire", taille: "normale" },
  }
);

export interface ProprietesBouton
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantesBouton> {
  asChild?: boolean;
}

export const Bouton = React.forwardRef<HTMLButtonElement, ProprietesBouton>(
  ({ className, variante, taille, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        className={cn(variantesBouton({ variante, taille }), className)}
        {...props}
      />
    );
  }
);
Bouton.displayName = "Bouton";
