import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";

interface SubmitButtonProps extends ButtonProps {
  pending: boolean;
}

/** Submit button that reflects the pending state of a form action. */
export function SubmitButton({
  pending,
  children,
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {children}
    </Button>
  );
}
