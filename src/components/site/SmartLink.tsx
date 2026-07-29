import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** Renders a router Link for internal paths and a plain anchor for external URLs. */
export function SmartLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const isInternal = href.startsWith("/");
  if (isInternal) {
    return (
      <Link to={href as never} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}
