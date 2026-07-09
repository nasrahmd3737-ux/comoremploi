import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="bg-hero-gradient py-16">
        <div className="container px-4 text-center">
          <h1 className="font-display text-3xl font-bold text-white md:text-4xl">
            Politique de Confidentialité
          </h1>
          <p className="mt-3 text-sm text-white/80">Dernière mise à jour : 1er juillet 2026</p>
        </div>
      </section>

      <main className="container px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-8 text-sm leading-7 text-muted-foreground">
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-foreground">INTRODUCTION</h2>
            <p className="mt-3">
              Comores Emploi (« nous », « notre », « la Plateforme »), éditée par Samirou Abdillah, s'engage à protéger la confidentialité de vos données personnelles. La présente Politique de Confidentialité explique quelles données nous collectons, pourquoi nous les collectons, comment nous les utilisons et quels sont vos droits. Elle est conforme au Règlement Général sur la Protection des Données (RGPD) et aux exigences des plateformes de distribution Apple App Store et Google Play Store.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-foreground">1. RESPONSABLE DU TRAITEMENT</h2>
            <p className="mt-3">
              Samirou Abdillah — Comores Emploi<br />
              Email de contact : contact.guinrese@gmail.com
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-foreground">2. DONNÉES COLLECTÉES</h2>
            <div className="mt-3 space-y-3">
              <div>
                <p className="font-medium text-foreground">2.1 Données que vous nous fournissez directement :</p>
                <ul className="mt-1 list-disc pl-5 space-y-1">
                  <li>Informations d'identification : nom complet, adresse email, numéro de téléphone</li>
                  <li>Informations de profil : localisation (île / ville), photo de profil (optionnelle), biographie professionnelle</li>
                  <li>Documents professionnels : CV, lettre de motivation, diplômes (candidats)</li>
                  <li>Informations entreprise : nom, secteur d'activité, description (employeurs)</li>
                  <li>Communications : messages échangés via la messagerie intégrée</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground">2.2 Données collectées automatiquement :</p>
                <ul className="mt-1 list-disc pl-5 space-y-1">
                  <li>Données techniques de connexion : adresse IP, type d'appareil, système d'exploitation, version de l'application</li>
                  <li>Données d'utilisation : fonctionnalités utilisées, pages consultées, durée des sessions</li>
                </ul>
                <p className="mt-1">Ces données sont collectées à des fins de sécurité et d'amélioration du service uniquement.</p>
              </div>
              <div>
                <p className="font-medium text-foreground">2.3 Données que nous ne collectons PAS :</p>
                <ul className="mt-1 list-disc pl-5 space-y-1">
                  <li>Aucune donnée bancaire ou de paiement</li>
                  <li>Aucune donnée de localisation GPS en temps réel</li>
                  <li>Aucune donnée biométrique</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-foreground">3. FINALITÉS ET BASE LÉGALE DU TRAITEMENT</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-foreground">
                    <th className="py-2 pr-4 font-medium">Finalité</th>
                    <th className="py-2 font-medium">Base légale</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr><td className="py-2 pr-4">Création et gestion de votre compte</td><td className="py-2">Exécution du contrat</td></tr>
                  <tr><td className="py-2 pr-4">Mise en relation candidats / employeurs</td><td className="py-2">Exécution du contrat</td></tr>
                  <tr><td className="py-2 pr-4">Modération des contenus</td><td className="py-2">Intérêt légitime</td></tr>
                  <tr><td className="py-2 pr-4">Amélioration du service</td><td className="py-2">Intérêt légitime</td></tr>
                  <tr><td className="py-2 pr-4">Publication de votre CV dans le vivier de talents</td><td className="py-2">Consentement explicite</td></tr>
                  <tr><td className="py-2 pr-4">Envoi de notifications importantes</td><td className="py-2">Intérêt légitime / Consentement</td></tr>
                  <tr><td className="py-2 pr-4">Respect des obligations légales</td><td className="py-2">Obligation légale</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-foreground">4. PARTAGE DES DONNÉES</h2>
            <p className="mt-3 font-medium text-foreground">4.1 Nous ne vendons jamais vos données personnelles.</p>
            <p className="mt-2 font-medium text-foreground">4.2 Partage limité dans les cas suivants :</p>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>Avec les Employeurs : uniquement les informations que vous choisissez de rendre publiques (nom, compétences, expérience). Vos coordonnées directes (email, téléphone) ne sont jamais communiquées à un Employeur sans votre consentement explicite.</li>
              <li>Avec nos prestataires techniques : Supabase Inc. (hébergement et base de données sécurisée). Ces prestataires sont contractuellement tenus de respecter la confidentialité de vos données.</li>
              <li>Sur ordre des autorités : uniquement si la loi l'exige expressément.</li>
            </ul>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-foreground">5. CONSERVATION DES DONNÉES</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>Données de compte actif : conservées pendant toute la durée d'activité du compte</li>
              <li>Après suppression du compte : suppression ou anonymisation dans un délai de 30 jours, sauf obligation légale de conservation plus longue</li>
              <li>Données de connexion techniques : conservées maximum 12 mois</li>
            </ul>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-foreground">6. SÉCURITÉ DES DONNÉES</h2>
            <p className="mt-3">Nous mettons en œuvre les mesures de sécurité suivantes :</p>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>Chiffrement des données en transit (HTTPS / TLS)</li>
              <li>Chiffrement des données au repos (Supabase)</li>
              <li>Contrôle d'accès strict par rôle (candidat / employeur / admin)</li>
              <li>Authentification sécurisée via token JWT</li>
              <li>Aucun stockage de mot de passe en clair</li>
            </ul>
            <p className="mt-3">
              En cas de violation de données susceptible d'affecter vos droits, nous vous en informerons dans les délais requis par la loi applicable.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-foreground">7. VOS DROITS</h2>
            <p className="mt-3">Conformément au RGPD et aux lois applicables sur la protection des données, vous disposez des droits suivants :</p>
            <ul className="mt-2 space-y-1">
              <li>✓ Droit d'accès : obtenir une copie de vos données personnelles</li>
              <li>✓ Droit de rectification : corriger des données inexactes</li>
              <li>✓ Droit à l'effacement : demander la suppression de vos données</li>
              <li>✓ Droit à la limitation : restreindre le traitement de vos données</li>
              <li>✓ Droit à la portabilité : recevoir vos données dans un format structuré</li>
              <li>✓ Droit d'opposition : vous opposer à certains traitements</li>
              <li>✓ Droit de retirer votre consentement : à tout moment, sans affecter la légalité des traitements antérieurs</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits : supprimez votre compte depuis l'application (
              <Link to="/dashboard/profile" className="text-primary underline hover:text-primary/80">
                Profil &gt; Supprimer mon compte
              </Link>
              ) ou contactez-nous à contact.guinrese@gmail.com.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-foreground">8. PROTECTION DES MINEURS</h2>
            <p className="mt-3">
              La Plateforme est réservée aux personnes majeures (18 ans et plus). Nous ne collectons pas sciemment de données de mineurs. Si vous constatez qu'un mineur a créé un compte, veuillez nous contacter pour suppression immédiate.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-foreground">9. COOKIES ET TRACEURS</h2>
            <p className="mt-3">
              La version web de la Plateforme utilise uniquement des cookies strictement nécessaires au fonctionnement du service (authentification, sécurité). Aucun cookie publicitaire ou de suivi tiers n'est déposé sans votre consentement.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-foreground">10. TRANSFERTS INTERNATIONAUX</h2>
            <p className="mt-3">
              Vos données peuvent être stockées sur des serveurs situés hors des Comores (Union Européenne / États-Unis via Supabase). Ces transferts sont encadrés par des garanties appropriées conformes aux standards internationaux de protection des données.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-foreground">11. COOKIES ET TECHNOLOGIES SIMILAIRES</h2>
            <p className="mt-3">
              L'application mobile n'utilise pas de cookies. Des identifiants de session techniques sont utilisés exclusivement pour maintenir votre connexion sécurisée.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-foreground">12. MODIFICATIONS DE CETTE POLITIQUE</h2>
            <p className="mt-3">
              Nous nous réservons le droit de modifier cette Politique à tout moment. La date de « dernière mise à jour » en tête de document sera actualisée. Pour les modifications substantielles, nous vous en informerons via l'application ou par email.
            </p>
          </section>

          <section className="rounded-2xl border bg-secondary p-6">
            <h2 className="font-display text-lg font-semibold text-secondary-foreground">13. CONTACT ET RÉCLAMATIONS</h2>
            <div className="mt-3 text-secondary-foreground/90 space-y-1">
              <p>Pour toute question, demande d'exercice de droits ou réclamation :</p>
              <p>Email : contact.guinrese@gmail.com</p>
              <p>Messagerie : via la messagerie intégrée de l'application</p>
              <p className="mt-3">
                Vous avez également le droit d'introduire une réclamation auprès de l'autorité de protection des données compétente dans votre pays de résidence.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
