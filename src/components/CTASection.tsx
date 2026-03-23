import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4">
        <div className="rounded-2xl bg-hero-gradient p-10 text-center md:p-16">
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
            Prêt à commencer ?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/80">
            Que vous soyez candidat ou employeur, rejoignez la communauté Comores Emploi et connectez-vous aux meilleures opportunités.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/signup">Je cherche un emploi</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
              <Link to="/signup?role=employer">Je recrute</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
