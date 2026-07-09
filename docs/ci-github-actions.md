# Intégration continue (GitHub Actions)

Ce workflow lance **typecheck + tests + build** à chaque push (`main` et
`claude/**`) et sur les pull requests vers `main`. Séquence validée localement
(20 tests Vitest, `tsc --noEmit`, `next build`).

> **Pourquoi ce fichier est ici et pas déjà actif ?**
> Le jeton utilisé par l'agent pour pousser n'a pas le scope `workflow`, et
> GitHub interdit à un tel jeton de créer/modifier un fichier sous
> `.github/workflows/`. Le contenu est donc fourni ici — il suffit de le
> recopier une fois, avec tes propres droits.

## Activation (une seule fois, ~30 s)

1. Sur GitHub : **Add file → Create new file**.
2. Nom du fichier : `.github/workflows/ci.yml`.
3. Colle le contenu ci-dessous.
4. **Commit** directement (l'UI GitHub utilise tes droits, qui incluent
   `workflow`).

Alternativement, depuis une machine avec un PAT ayant la case **`workflow`**
cochée : crée `.github/workflows/ci.yml` avec ce contenu, commit et push.

## Contenu de `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, "claude/**"]
  pull_request:
    branches: [main]

# Cancel superseded runs on the same ref to save minutes.
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    name: Typecheck · Test · Build
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build
        env:
          # Public env is required at build time; use inert placeholders so the
          # build never fails on missing secrets. Real values live in Vercel.
          NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder-anon-key
          NEXT_PUBLIC_SITE_URL: https://quickgo.cm
```

## Note sur le lint

Le script `pnpm lint` du projet est cassé en amont (ESLint sans configuration
« flat », `eslint-config-next` incompatible avec la version d'ESLint résolue).
Il est volontairement **hors des gates CI** pour ne pas rendre le pipeline
rouge. À réparer séparément (créer un `eslint.config.mjs` fonctionnel), puis
ajouter une étape `- name: Lint / run: pnpm lint` au workflow.
