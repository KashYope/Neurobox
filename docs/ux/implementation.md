# Cohérence des parcours NDee

Les cinq écrans structurants sont représentés dans `wireframes.html`, avec les compositions mobile, tablette et desktop. Le parcours d'aide est accueil → situation → exercice ; le profil est indépendant et facultatif.

La coque publique possède la navigation. Les espaces professionnels se rejoignent directement par `/admin` et `/partner` et conservent leur authentification serveur. Les trois destinations publiques existantes restent stables.

Le résumé du profil est calculé depuis les 134 questions principales, avec 10 secondes par réponse comme estimation initiale. Les quatre questions de contexte ne participent ni aux scores ni à la progression principale. Aucun changement de version, de catalogue, d'échelle, de transfert ou de calcul clinique n'est introduit.

Les résultats proposent trois exercices immédiatement avec le même composant que le catalogue. Le classement reste générique tant que la personnalisation n’a pas été explicitement activée pour les réponses actuelles.

Les réponses sont enregistrées avant de changer de question. Un verrou bloque les doubles soumissions ; le changement visible attend au moins 200 ms. Au clavier, les flèches choisissent une valeur, Entrée ou Espace confirme. Une correction depuis les résultats se valide explicitement. En cas d'erreur de stockage, la question et la sélection restent visibles et permettent de réessayer.

## Validation manuelle

1. À 360, 820 et 1440 px, aller de Maintenant à une situation puis aux instructions ; revenir et vérifier le filtre.
2. Commencer le profil, répondre, quitter, recharger hors ligne et reprendre ; vérifier les pauses et la correction depuis les résultats.
3. Tester le questionnaire et les menus au clavier et au lecteur d'écran ; vérifier les textes longs en allemand et néerlandais.
4. Importer un QR existant, exporter un PDF, activer puis retirer la personnalisation ; confirmer les suppressions.
5. Ouvrir `/admin` sans session puis avec un partenaire et un administrateur ; les données administratives restent réservées au rôle requis.

## Itération du 1 octobre 2026 — profil plus léger

- La synthèse porte le titre « Mon profil ». Un profil incomplet propose immédiatement la reprise, avec pourcentage, thème et durée restante.
- Les exports PDF/QR et imports restent disponibles dans « Exporter ou transférer mon profil ». La correction, les thèmes, les archives et la suppression sont regroupés dans « Gérer mes réponses ».
- Les calculs et formats de sauvegarde sont inchangés. Les libellés sont disponibles en français et anglais.
- Validation : 58 tests Node réussis, compilations frontend et backend réussies. Vérification visuelle non terminée : le navigateur intégré refuse la connexion au serveur local malgré sa relance ; l’accessibilité native des sections dépliables devra être confirmée dans le navigateur.

### Vérification visuelle terminée

Le profil a été vérifié dans un aperçu isolé sur le port 3002 avec une réponse fictive, sans modifier les données de l’aperçu utilisateur sur 3001. L’accès à la synthèse partielle a été corrigé pour être disponible dès la première réponse. Enregistrement et avancement automatiques confirmés ; ouverture/fermeture des sections par Entrée/Espace confirmée. Aucun débordement horizontal à 360, 820 et 1440 px. Capture : /private/tmp/ndee-profil-verifie.png. Cette vérification ne remplace pas un audit complet avec lecteur d’écran.

### Lot 4 — fiche exercice

La fiche utilise une largeur de lecture de 640 px, une illustration secondaire compacte sur tablette/desktop et des étapes séparées par des lignes plutôt que des cartes imbriquées. Le retour contextuel est un bouton complet. Le titre reçoit le focus à l’ouverture et la page revient en haut.

Parcours vérifié : accueil → Stress → exercice (deux clics), retour au catalogue avec filtre Stress conservé. Aucun débordement horizontal à 360, 820 et 1440 px. Capture : /private/tmp/ndee-exercice-refonte.png.

Le catalogue développé est conservé dans l’entrée d’historique : après ouverture d’une fiche et retour, les exercices supplémentaires restent visibles. Vérification navigateur effectuée sur un exercice au-delà des trois suggestions initiales.

### Précautions localisées

Les onze précautions du catalogue intégré disposent de traductions locales FR/EN/DE/ES/NL, y compris hors ligne. Les traductions serveur et précautions modifiées restent prioritaires ; les identifiants explicites sont respectés et une traduction vide ne supprime pas la consigne originale. Un seul encadré rassemble note générale et précaution spécifique, avec déduplication des textes identiques. Vérification navigateur dans les cinq langues et 61 tests réussis ; compilations frontend/backend réussies.

### Correction de sélection après retour

La localisation des précautions recréait les objets d’exercice à chaque rendu, relançant les effets de synchronisation de fiche et d’historique. Le résultat du hook est désormais mémorisé et les résultats de traduction asynchrones obsolètes sont ignorés. La fiche est dérivée d’un identifiant sélectionné unique ; le catalogue ne peut plus réappliquer une ancienne sélection via un effet de rafraîchissement d’objet. Vérification navigateur : Jacobson → retour → Psoas → retour navigateur → Respiration, puis Précédent/Suivant et rechargement. Identité de fiche et filtre Sommeil conservés.

### Lot 5 — états interactifs communs

Les cartes partagent une bordure visible issue du système visuel et le mouvement au survol respecte la préférence de réduction des animations. Le libellé « Exercice recommandé » est réservé au titre de section. Le compteur du catalogue est localisé dans les cinq langues et annoncé par une zone de statut. Au retour d’une fiche, le focus retrouve la carte quittée, vérifié sur Câlin Papillon. Les contrôles responsive de cette itération ont été interrompus par des délais du navigateur et restent à confirmer.

### Questionnaire — aide clavier visible

Les consignes clavier sont visibles en français et anglais. Le parcours normal indique les flèches pour sélectionner et Entrée ou Espace pour confirmer ; la correction indique le bouton explicite « Enregistrer et revenir aux résultats ». Les événements répétés d’Entrée et Espace sont ignorés, sans bloquer la répétition des flèches. Vérification du code et 61 tests réussis ; compilations frontend/backend réussies. Cette itération n’a pas encore fait l’objet d’une vérification clavier dans le navigateur.

### Résultats — restauration de la valeur ajoutée de NeuroAlign

Les anciennes applications `../neuroalign` et `../neuroalign-pro` ont été consultées sans modification. Le radar à cinq axes est réintégré avec les scores actuels de NDee : les données manquantes ne sont pas transformées en zéro et les thèmes partiels sont distingués. Une liste de valeurs complète le SVG pour la lecture accessible.

Les stratégies, guides pratiques, outils et exemples de forces FR/EN de `../neuroalign/i18n.ts` sont repris dans `features/assessment/insights.ts`. Les formulations diagnostiques de l’ancienne interprétation ne sont pas reprises : les conseils restent des pistes et les exemples de forces ne sont pas déduits des scores. Les conseils, astuces et lectures sont visibles par thème renseigné ; guides, forces et outils sont regroupés dans un dépliant dédié. Les lectures externes indiquent leur langue et l’ouverture d’un nouvel onglet. Les scores détaillés restent dépliables et la personnalisation reste explicite.

Vérification navigateur sur l’origine de test isolée `127.0.0.1:3003` : résultat partiel, import d’un profil fictif complet, radar, cinq blocs de stratégies/lectures, ouverture des outils et traduction anglaise. Aucun changement aux réponses de l’utilisateur. Capture : `docs/ux/results-restored.png`. Trois tests de régression couvrent les valeurs absentes, le graphe complet et les ressources des cinq thèmes dans les deux langues.

Les graduations numériques ont ensuite été retirées du radar. Chaque sous-dimension dispose d’un fond rempli proportionnellement au score ; le texte blanc est découpé à la même frontière, au-dessus du texte sombre, pour assurer le contraste dans les deux zones. La copie décorative est masquée aux lecteurs d’écran. Vérification navigateur à 75 % et capture `docs/ux/score-rows.png`.

### Informations légales et contact

Ajout dans le menu ancré des CGU et mentions légales ; confidentialité complétée en FR/EN/DE/ES/NL. Éditeur confirmé par l’utilisateur : Kash Hauzeur, particulier en Belgique ; hébergeur déclaré : Contabo. L’adresse e-mail est obfusquée à l’affichage et le lien mailto n’est rendu qu’après activation du bouton de révélation. Cette mesure réduit la collecte directe, sans garantie contre le spam.

La confidentialité distingue les réponses locales, sans transmission serveur, des comptes professionnels, contributions et identifiants pseudonymisés de vote effectivement persistés en base. Les données locales n’expirent pas automatiquement ; les boutons de suppression locale ne suppriment pas les données serveur. Le cookie professionnel expire après 24 heures. Un lien vers l’Autorité de protection des données belge complète l’information sur les droits.

À compléter avant de considérer la politique juridique exhaustive : durées et règles de conservation des comptes/contributions/votes, configuration des journaux et sauvegardes de l’hébergement, coordonnées précises de l’entité Contabo contractante et examen des bases légales applicables. Aucune politique de purge n’a été inventée et aucun traitement serveur n’a été modifié. Sources consultées : informations du SPF Économie, CNIL sur le stockage local, Contabo et APD belge. Vérification navigateur : CGU, mentions légales, Échap, zéro lien mailto avant révélation puis un après. Capture `docs/ux/legal-notice.png` ; 64 tests et compilations frontend/backend réussis.
