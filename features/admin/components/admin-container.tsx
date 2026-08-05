import type { ReactNode } from "react";

interface AdminContainerProps {
  children: ReactNode;
  className?: string;
}

export function AdminContainer({ children, className }: AdminContainerProps) {
  return (
    <div
      className={[
        "mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8",
        className ?? "",
      ]
        .join(" ")
        .trim()}
    >
      {children}
    </div>
  );
}
