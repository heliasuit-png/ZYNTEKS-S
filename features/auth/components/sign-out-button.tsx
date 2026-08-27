"use client";

import { LogOut } from "lucide-react";

import { useDictionary } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";

type SignOutButtonProps = Pick<ButtonProps, "variant" | "size" | "className">;

/** Signs the current user out via a server action. */
export function SignOutButton({
  variant = "outline",
  size,
  className,
}: SignOutButtonProps) {
  const { dict } = useDictionary();

  return (
    <form action={signOutAction}>
      <Button type="submit" variant={variant} size={size} className={className}>
        <LogOut aria-hidden />
        {dict.dash.shell.signOut}
      </Button>
    </form>
  );
}
