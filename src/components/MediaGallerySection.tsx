import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Image as ImageIcon, Play } from "lucide-react";

interface MediaItem {
  id: string;
  title: string | null;
  media_type: "photo" | "video";
  storage_path: string;
  url?: string;
}

const SIGNED_URL_TTL = 60 * 60; // 1h

export default function MediaGallerySection() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("media_items")
        .select("id, title, media_type, storage_path")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      const rows = (data as MediaItem[]) ?? [];
      const withUrls = await Promise.all(
        rows.map(async (r) => {
          const { data: signed } = await supabase.storage
            .from("media")
            .createSignedUrl(r.storage_path, SIGNED_URL_TTL);
          return { ...r, url: signed?.signedUrl };
        })
      );
      setItems(withUrls.filter((i) => i.url));
      setLoading(false);
    })();
  }, []);

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="container px-4">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Galerie médias
          </h2>
          <p className="mt-3 text-muted-foreground">
            Photos et vidéos partagées par Comores Emploi
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <Card
              key={m.id}
              className="group relative aspect-video overflow-hidden border bg-muted"
            >
              {m.media_type === "photo" ? (
                <img
                  src={m.url}
                  alt={m.title ?? "Photo"}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <video
                  src={m.url}
                  controls
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              )}
              {m.title && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-white">
                    {m.media_type === "video" ? (
                      <Play className="h-3.5 w-3.5" />
                    ) : (
                      <ImageIcon className="h-3.5 w-3.5" />
                    )}
                    {m.title}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
