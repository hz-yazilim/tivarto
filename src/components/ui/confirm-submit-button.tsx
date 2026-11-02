"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./button";

type ButtonProps = React.ComponentProps<typeof Button>;

/**
 * Yıkıcı işlemler (silme vb.) için onay isteyen gönder düğmesi.
 *
 * Neden ayrı bileşen?
 *   Server action'lara `onSubmit={confirm}` gibi fonksiyon prop'ları
 *   geçirilemez (sunucu -> istemci sınırı). Onay bu yüzden düğme tarafında,
 *   form gönderilmeden ÖNCE alınır.
 */
export function ConfirmSubmitButton({
  message,
  children,
  ...props
}: ButtonProps & { message: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      {...props}
    >
      {pending ? "İşleniyor..." : children}
    </Button>
  );
}
