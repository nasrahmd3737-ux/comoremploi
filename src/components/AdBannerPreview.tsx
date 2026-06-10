import { useEffect, useState } from "react";

interface Ad {
  id: string;
  title: string;
  link_url: string;
}

interface AdBannerPreviewProps {
  ads: Ad[];
}

function MiniAdBanner({ ads, className }: { ads: Ad[]; className?: string }) {
  if (ads.length === 0) return null;
  const items = [...ads, ...ads];
  return (
    <div className={`w-full bg-gradient-to-r from-primary via-gold to-primary border-b-2 border-gold/60 overflow-hidden ${className}`}>
      <div className="relative flex whitespace-nowrap py-2">
        <div className="animate-marquee flex shrink-0 gap-12 pr-12">
          {items.map((ad, i) => (
            <a
              key={`${ad.id}-${i}`}
              href={ad.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-white hover:underline px-2"
              onClick={(e) => e.preventDefault()}
            >
              {ad.title}
            </a>
          ))}
        </div>
        <div className="animate-marquee flex shrink-0 gap-12 pr-12" aria-hidden="true">
          {items.map((ad, i) => (
            <a
              key={`b-${ad.id}-${i}`}
              href={ad.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-white hover:underline px-2"
              onClick={(e) => e.preventDefault()}
            >
              {ad.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdBannerPreview({ ads }: AdBannerPreviewProps) {
  const activeAds = ads.filter((a) => (a as any).active !== false);
  const [now, setNow] = useState(Date.now());

  // Force re-render to keep marquee smooth-ish in preview
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-4" key={now}>
      {/* Desktop preview */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aperçu Desktop</p>
        <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
          <div className="bg-card border-b px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
            <div className="mx-auto text-[10px] text-muted-foreground bg-muted px-3 py-0.5 rounded-full truncate max-w-[60%]">
              comoremploi.com
            </div>
          </div>
          <MiniAdBanner ads={activeAds} />
          <div className="h-16 bg-card flex items-center justify-center text-xs text-muted-foreground">
            Contenu du site…
          </div>
        </div>
      </div>

      {/* Mobile preview */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aperçu Mobile</p>
        <div className="flex justify-start">
          <div className="w-[320px] rounded-[2rem] border-4 border-muted bg-background shadow-lg overflow-hidden">
            <div className="bg-card border-b px-3 py-1.5 flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">9:41</span>
              <div className="flex gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
              </div>
            </div>
            <MiniAdBanner ads={activeAds} />
            <div className="h-20 bg-card flex items-center justify-center text-[10px] text-muted-foreground">
              Contenu du site…
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
