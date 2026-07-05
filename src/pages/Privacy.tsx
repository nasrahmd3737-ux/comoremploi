import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Shield, UserX, Mail, Eye, Lock, Server, Globe, FileText } from "lucide-react";

const sections = [
  {
    icon: Shield,
    title: "1. Identité du responsable du traitement",
    content:
      "Le présent site, dénommé Comores Emploi, est édité et exploité dans le respect des principes européens de protection des données personnelles. Le responsable du traitement des données collectées est l’équipe d’administration de Comores Emploi, joignable via les canaux de contact mis à disposition sur la plateforme.",
  },
  {
    icon: Eye,
    title: "2. Données collectées et finalités",
    content:
      "Nous collectons et traitons les données strictement nécessaires à la fourniture du service : nom et prénom, adresse e-mail, numéro de téléphone, localisation géographique, parcours professionnel, formations, compétences, CV et documents joints. Ces données sont utilisées pour mettre en relation les candidats et les employeurs, assurer la modération, améliorer la qualité du service et garantir la sécurité des échanges. Les coordonnées des employeurs et des candidats ne sont visibles que par l’administration, sauf consentement explicite.",
  },
  {
    icon: Lock,
    title: "3. Base légale du traitement",
    content:
      "Le traitement de vos données repose sur l’exécution du contrat de mise à disposition de la plateforme (CGU), sur votre consentement lorsque la loi l’exige, et sur l’intérêt légitime consistant à assurer la sécurité, la modération et la lutte contre la fraude. Vous pouvez retirer votre consentement à tout moment, sans que cela n’affecte la licéité du traitement fondé sur votre consentement antérieur.",
  },
  {
    icon: Server,
    title: "4. Hébergement et transferts de données",
    content:
      "Les données sont hébergées sur une infrastructure cloud sécurisée (backend Lovable Cloud / Supabase) dont les serveurs peuvent être situés en dehors de l’Union européenne. Le cas échéant, des garanties contractuelles conformes aux clauses contractuelles types de la Commission européenne sont mises en place pour assurer un niveau de protection adéquat.",
  },
  {
    icon: FileText,
    title: "5. Durée de conservation",
    content:
      "Vos données sont conservées pendant toute la durée de votre inscription et jusqu’à douze (12) mois après la suppression de votre compte, afin de satisfaire aux obligations légales et de permettre la résolution des litiges éventuels. Passé ce délai, elles sont définitivement effacées ou anonymisées.",
  },
  {
    icon: Globe,
    title: "6. Cookies et traceurs",
    content:
      "La plateforme utilise des cookies strictement nécessaires au fonctionnement du service (authentification, sécurité) et, le cas échéant, des cookies d’analyse d’audience anonymisés. Aucun cookie publicitaire tiers n’est déposé sans votre consentement préalable.",
  },
];

const rights = [
  "Droit d’accès à vos données et à une copie portable ;",
  "Droit de rectification des données inexactes ou incomplètes ;",
  "Droit à l’effacement (droit à l’oubli) dans les conditions prévues par la réglementation ;",
  "Droit à la limitation du traitement ;",
  "Droit d’opposition au traitement fondé sur l’intérêt légitime ;",
  "Droit de retirer votre consentement à tout moment ;",
  "Droit de définir des directives relatives au sort de vos données après votre décès.",
];

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="bg-hero-gradient py-16">
        <div className="container px-4 text-center">
          <h1 className="font-display text-3xl font-bold text-white md:text-4xl">
            Politique de confidentialité
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-white/80 md:text-base">
            Comores Emploi s’engage à protéger vos données personnelles conformément aux standards européens. Cette politique vous informe sur la manière dont nous collectons, utilisons et sécurisons vos informations.
          </p>
        </div>
      </section>

      <main className="container px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="text-sm leading-7 text-muted-foreground">
              La présente politique de confidentialité s’applique à l’ensemble des services proposés par la plateforme Comores Emploi (site web et application mobile). Elle a pour objet de détailler les catégories de données traitées, les finalités poursuivies, les droits dont vous disposez et les mesures de sécurité mises en œuvre. En utilisant nos services, vous reconnaissez avoir pris connaissance de cette politique.
            </p>
          </section>

          {sections.map((s) => (
            <section key={s.title} className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <s.icon className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-semibold">{s.title}</h2>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{s.content}</p>
            </section>
          ))}

          {/* Account deletion */}
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <UserX className="h-5 w-5 text-destructive" />
              <h2 className="font-display text-xl font-semibold">7. Suppression de compte</h2>
            </div>
            <div className="mt-3 text-sm leading-7 text-muted-foreground space-y-2">
              <p>
                Vous disposez à tout moment d’un droit de suppression de votre compte et de l’ensemble des données qui y sont associées. La suppression entraîne l’effacement définitif de votre profil, de vos CV, de vos candidatures, de vos messages et de toute donnée personnelle vous concernant, sous réserve des obligations légales de conservation.
              </p>
              <p className="font-medium text-foreground">
                Pour exercer ce droit, rendez-vous dans{" "}
                <Link to="/dashboard/profile" className="text-primary underline hover:text-primary/80">
                  Mon Profil → Supprimer mon compte
                </Link>
                . Vous devrez confirmer votre demande en saisissant la phrase de validation affichée à l’écran.
              </p>
            </div>
          </section>

          {/* Data subject rights */}
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">8. Vos droits sur vos données</h2>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Conformément au Règlement général sur la protection des données (RGPD) et à la législation applicable, vous disposez des droits suivants :
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-7 text-muted-foreground">
              {rights.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Pour exercer ces droits, adressez votre demande à l’administration de Comores Emploi via les moyens de contact disponibles sur la plateforme. Une réponse vous sera adressée dans un délai maximum d’un (1) mois à compter de la réception de votre demande.
            </p>
          </section>

          <section className="rounded-2xl border bg-secondary p-6">
            <h2 className="font-display text-xl font-semibold text-secondary-foreground">9. Contact</h2>
            <p className="mt-3 text-sm leading-7 text-secondary-foreground/80">
              Pour toute question relative à la présente politique de confidentialité ou à l’exercice de vos droits, veuillez contacter l’équipe d’administration de Comores Emploi via les canaux de contact disponibles sur la plateforme.
            </p>
          </section>

          <p className="text-center text-xs text-muted-foreground">
            Dernière mise à jour : juillet 2026
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
