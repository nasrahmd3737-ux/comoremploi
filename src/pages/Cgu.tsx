import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const sections = [
  {
    title: "1. Objet de la plateforme",
    content:
      "Comores Emploi met en relation les candidats, les employeurs et l’équipe d’administration afin de faciliter la diffusion d’offres, la réception de candidatures et le suivi du recrutement dans un cadre sécurisé.",
  },
  {
    title: "2. Création et gestion des comptes",
    content:
      "L’utilisateur s’engage à fournir des informations exactes, à jour et complètes lors de l’inscription. Chaque compte est personnel et l’utilisateur reste responsable de la confidentialité de ses identifiants.",
  },
  {
    title: "3. Règles pour les employeurs",
    content:
      "Les employeurs doivent publier des offres réelles, conformes au droit applicable et sans contenu trompeur, discriminatoire ou frauduleux. Lorsqu’un employeur souhaite avancer avec un candidat, la mise en relation est encadrée par l’administration de la plateforme.",
  },
  {
    title: "4. Règles pour les candidats",
    content:
      "Les candidats doivent transmettre uniquement des informations professionnelles exactes. Toute candidature mensongère, abusive ou portant atteinte à un tiers peut entraîner la suspension du compte.",
  },
  {
    title: "5. Contenus interdits",
    content:
      "Il est interdit de publier ou transmettre des contenus illicites, diffamatoires, violents, discriminatoires, trompeurs, publicitaires non autorisés ou portant atteinte aux droits d’autrui. Les comptes contrevenants peuvent être suspendus ou supprimés.",
  },
  {
    title: "6. Modération et administration",
    content:
      "Comores Emploi peut vérifier, refuser, modifier, suspendre ou supprimer toute offre, candidature, conversation ou compte lorsque cela est nécessaire pour protéger les utilisateurs, assurer la qualité du service ou faire respecter les présentes CGU.",
  },
  {
    title: "7. Données personnelles",
    content:
      "Les informations partagées sur la plateforme sont utilisées pour permettre le recrutement, améliorer le service et assurer la sécurité des échanges. L’utilisateur reste propriétaire des données qu’il renseigne, sous réserve des droits nécessaires au fonctionnement de la plateforme.",
  },
  {
    title: "8. Limitation de responsabilité",
    content:
      "Comores Emploi agit comme plateforme d’intermédiation et ne garantit ni l’embauche d’un candidat, ni la conclusion d’un recrutement. Chaque utilisateur demeure responsable des informations, décisions et échanges qu’il engage via le service.",
  },
  {
    title: "9. Suspension, résiliation et évolution",
    content:
      "La plateforme peut faire évoluer ses fonctionnalités et ses présentes conditions à tout moment. L’utilisation continue du service après mise à jour vaut acceptation des nouvelles conditions d’utilisation.",
  },
];

const Cgu = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="bg-hero-gradient py-16">
        <div className="container px-4 text-center">
          <h1 className="font-display text-3xl font-bold text-white md:text-4xl">Conditions générales d’utilisation</h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-white/80 md:text-base">
            En utilisant Comores Emploi, vous acceptez les règles ci-dessous relatives à l’accès au service, à la diffusion des offres, aux candidatures et à la sécurité des échanges.
          </p>
        </div>
      </section>

      <main className="container px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="text-sm leading-7 text-muted-foreground">
              Ces CGU encadrent l’utilisation de la plateforme Comores Emploi par tout visiteur, candidat, employeur ou administrateur. Si vous n’acceptez pas ces conditions, vous ne devez pas utiliser le service.
            </p>
          </section>

          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="font-display text-xl font-semibold">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.content}</p>
            </section>
          ))}

          <section className="rounded-2xl border bg-secondary p-6">
            <h2 className="font-display text-xl font-semibold text-secondary-foreground">10. Contact</h2>
            <p className="mt-3 text-sm leading-7 text-secondary-foreground/80">
              Pour toute question liée à ces conditions d’utilisation ou à un usage abusif de la plateforme, veuillez contacter l’équipe d’administration de Comores Emploi via les moyens de contact disponibles sur la plateforme.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cgu;