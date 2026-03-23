// Islands and cities of Comoros
export const ISLANDS: Record<string, string[]> = {
  "Grande Comore": ["Moroni", "Mitsamiouli", "Mbéni", "Itsandra", "Hahaya", "Iconi", "Foumbouni", "Ntsoudjini"],
  "Anjouan": ["Mutsamudu", "Domoni", "Sima", "Ouani", "Mirontsi", "Tsembehou", "Moya"],
  "Mohéli": ["Fomboni", "Nioumachoua", "Wanani", "Djoyézi"],
};

export const ALL_CITIES = Object.values(ISLANDS).flat();

export function formatLocation(island: string, city: string) {
  return `${city}, ${island}`;
}

export function parseLocation(location: string): { island: string; city: string } {
  const parts = location.split(", ");
  if (parts.length === 2) {
    return { city: parts[0], island: parts[1] };
  }
  // Fallback: try to find the city in islands
  for (const [island, cities] of Object.entries(ISLANDS)) {
    if (cities.includes(location)) {
      return { city: location, island };
    }
  }
  return { city: location, island: "Grande Comore" };
}
