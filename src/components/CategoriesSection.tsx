import { Briefcase, Building2, Palmtree, Laptop, Hammer, GraduationCap, Heart, ShoppingBag } from "lucide-react";

const categories = [
  { name: "Administration", icon: Building2, count: 42 },
  { name: "Tourisme", icon: Palmtree, count: 35 },
  { name: "Technologie", icon: Laptop, count: 28 },
  { name: "Construction", icon: Hammer, count: 24 },
  { name: "Éducation", icon: GraduationCap, count: 19 },
  { name: "Santé", icon: Heart, count: 16 },
  { name: "Commerce", icon: ShoppingBag, count: 22 },
  { name: "Autres", icon: Briefcase, count: 31 },
];

const CategoriesSection = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Explorez par catégorie
          </h2>
          <p className="mt-3 text-muted-foreground">
            Des opportunités dans tous les secteurs aux Comores
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {categories.map((cat) => (
            <button
              key={cat.name}
              className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 bg-card-hover"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <cat.icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-foreground">{cat.name}</span>
              <span className="text-xs text-muted-foreground">{cat.count} offres</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
