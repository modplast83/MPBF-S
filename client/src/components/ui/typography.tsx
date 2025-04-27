import { FC, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TypographyProps extends HTMLAttributes<HTMLHeadingElement | HTMLParagraphElement> {
  children: ReactNode;
  className?: string;
}

// Heading 1
export const H1: FC<TypographyProps> = ({ children, className, ...props }) => {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
};

// Heading 2
export const H2: FC<TypographyProps> = ({ children, className, ...props }) => {
  return (
    <h2
      className={cn(
        "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
};

// Heading 3
export const H3: FC<TypographyProps> = ({ children, className, ...props }) => {
  return (
    <h3
      className={cn(
        "scroll-m-20 text-2xl font-semibold tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
};

// Heading 4
export const H4: FC<TypographyProps> = ({ children, className, ...props }) => {
  return (
    <h4
      className={cn(
        "scroll-m-20 text-xl font-semibold tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h4>
  );
};

// Paragraph
export const P: FC<TypographyProps> = ({ children, className, ...props }) => {
  return (
    <p
      className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
      {...props}
    >
      {children}
    </p>
  );
};

// Large text
export const Large: FC<TypographyProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn("text-lg font-semibold", className)}
      {...props}
    >
      {children}
    </div>
  );
};

// Small text
export const Small: FC<TypographyProps> = ({ children, className, ...props }) => {
  return (
    <small
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    >
      {children}
    </small>
  );
};

// Muted text
export const Muted: FC<TypographyProps> = ({ children, className, ...props }) => {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
};