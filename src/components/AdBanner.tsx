import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Ad {
  id: string;
  title: string;
  link_url: string;
}

export default function AdBanner() {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    supabase
      .from("ads")
      .select("id, title, link_url")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setAds(data ?? []));
  }, []);

  if (ads.length === 0) return null;

  // Duplicate items for seamless marquee
  const items = [...ads, ...ads];

  return (
    <div className="w-full bg-gradient-to-r from-primary via-gold to-primary border-b-2 border-gold/60 overflow-hidden">
      <div className="relative flex whitespace-nowrap py-2">
        <div className="animate-marquee flex shrink-0 gap-12 pr-12">
          {items.map((ad, i) => (
            <a
              key={`${ad.id}-${i}`}
              href={ad.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-white hover:underline px-2"
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
            >
              {ad.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
