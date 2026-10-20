# Déploiement

## Variables d'environnement

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `DATABASE_URL` | oui | Base de données (voir [bases-de-donnees.md](bases-de-donnees.md)) |
| `JWT_SECRET` | oui | Clé de signature des sessions, 32 caractères aléatoires minimum |
| `SESSION_HEURES` | non | Durée de session (sinon paramètre `SESSION_HEURES`, 10 h) |
| `SIGNALETIQUE_MODE` | non | `simulation` (défaut), `api`, `desactive` |
| `SIGNALETIQUE_URL`, `SIGNALETIQUE_JETON` | si `api` | Service de signalétique du système central : `GET {URL}/{compte}` |
| `ANTHROPIC_API_KEY` | non | Assistant IA d'analyse des EIES (à activer aussi dans Paramétrage) |
| `SGES_ADMIN_EMAIL` | non | Adresse du premier administrateur créé par `db:seed` |
| `COOKIE_NON_SECURISE` | non | `true` uniquement pour un test en HTTP sans TLS |

## Serveur (machine virtuelle, conteneur)

```bash
npm ci
npm run db:schema && npm run db:seed
npm run build
npm start                 # port 3000 ; derrière un reverse proxy TLS (nginx, F5…)
```

La compilation produit une sortie autonome (`.next/standalone`). Sonde de supervision :
`GET /api/sante` (200 si la base répond, 503 sinon).

## Docker

```bash
docker compose up -d              # PostgreSQL + application
docker compose exec app npx tsx prisma/seed.ts
```

## Vercel

Renseigner `DATABASE_URL` (adresse d'un *pooler* : PgBouncer, Supabase, RDS Proxy, avec
`?pgbouncer=true&connection_limit=1`) et `JWT_SECRET`, puis déployer. Les commandes
`db:schema`, `db:importer`, `db:verifier` utilisent l'adresse **directe** de la base.

## Sécurité en production

- TLS obligatoire (cookie `Secure`, `SameSite=Lax`, `HttpOnly`) ;
- changer le mot de passe provisoire de l'administrateur à la première connexion ;
- ne jamais lancer `db:seed -- --demo` ;
- restreindre l'accès réseau à la base ; sauvegardes régulières (`db:exporter` ou outils du SGBD) ;
- clés d'API par système consommateur, rattachées à une entité, avec date d'expiration.
