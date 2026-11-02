"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./button";

type ButtonProps = React.ComponentProps<typeof Button>;

/** Server action formları için bekliyor durumunu gösteren gönder düğmesi. */
export function SubmitButton({ children, disabled, ...props }: ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? "Kaydediliyor..." : children}
    </Button>
  );
}
