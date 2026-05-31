import { X } from "lucide-react";
import { Button } from "./Button";

export function Modal({
  title,
  open,
  onClose,
  children,
  backgroundImage,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  backgroundImage?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <section
        className="
        relative
        max-h-[92vh]
        w-full
        max-w-1xl
        overflow-auto
        rounded-[52px]
        border
        border-white/10
        shadow-2xl
      "
        style={
          backgroundImage
            ? {
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {
                background:
                  "linear-gradient(to bottom right, #0f172a, #111827)",
              }
        }
      >
        {/* Blur Overlay */}
        {backgroundImage && (
          <>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/90" />
          </>
        )}

        {/* Content */}
        <div className="relative z-10">
          <header className="flex items-center justify-between px-5 py-4">
            <h2 className="text-lg font-black tracking-tight text-white">
              {title}
            </h2>

            <Button
              variant="ghost"
              className="
              h-10
              w-10
              rounded-2xl
              border
              border-white/10
              bg-white/10
              px-0
              text-white
              backdrop-blur-xl
            "
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </Button>
          </header>

          <div className="p-5">{children}</div>
        </div>
      </section>
    </div>
  );
}
