/**
 * @file src/components/common/Card.tsx
 * @description Reusable card component
 */

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  as?: "div" | "article" | "section";
}

export default function Card({
  children,
  className,
  hover = false,
  onClick,
  as = "div",
}: CardProps) {
  const Component = as;

  if (hover || onClick) {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
        className={cn(
          "bg-white rounded-xl border border-gray-100 shadow-sm",
          "transition-shadow duration-200 hover:shadow-md",
          onClick && "cursor-pointer",
          className
        )}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <Component
      className={cn(
        "bg-white rounded-xl border border-gray-100 shadow-sm",
        className
      )}
    >
      {children}
    </Component>
  );
}

// Card Header
export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 py-4 border-b border-gray-100", className)}>
      {children}
    </div>
  );
}

// Card Body
export function CardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

// Card Footer
export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl",
        className
      )}
    >
      {children}
    </div>
  );
}
