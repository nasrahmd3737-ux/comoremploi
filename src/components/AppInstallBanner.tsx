import { useEffect, useState } from "react";
import { X, Smartphone, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "comoremploi_install_banner_dismissed_v1";
const PLAY_URL = "https://play.google.com/store/apps/details?id=com.comoremploi.app";

export default function AppInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="relative z-50 w-full bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground shadow-md">
      <div className="container flex flex-col items-center justify-between gap-2 px-4 py-2 sm:flex-row sm:gap-4">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <Smartphone className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium leading-tight">
            L'application <span className="font-bold">Comores Emploi</span> est disponible sur{" "}
            <span className="inline-flex items-center gap-1">
              Play Store <Apple className="h-3.5 w-3.5" /> App Store
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            variant="secondary"
            className="h-8 rounded-full px-3 text-xs font-semibold"
          >
            <a href={PLAY_URL} target="_blank" rel="noopener noreferrer">Installer</a>
          </Button>
          <button
            onClick={dismiss}
            aria-label="Fermer"
            className="rounded-full p-1 transition hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
