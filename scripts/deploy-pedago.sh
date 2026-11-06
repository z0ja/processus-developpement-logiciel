#!/usr/bin/env bash
# Met à jour l'instance déployée sur le serveur pedago après un merge sur main.
#
# Usage (sur le serveur, depuis n'importe quel dossier) :
#   ./scripts/deploy-pedago.sh            # port par défaut : 3333
#   PORT=3742 ./scripts/deploy-pedago.sh
#
# Étapes : arrêt de l'app → git pull → npm ci (seulement si les dépendances ont changé)
#          → migrations → build → redémarrage en arrière-plan → vérification.
set -euo pipefail

PORT="${PORT:-3333}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG="$ROOT/app.log"
TRASH="$HOME/.deploy-trash"

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

cd "$ROOT"

# --- Vérifications préalables -------------------------------------------------
branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = "main" ] || fail "Le serveur doit être sur main (branche actuelle : $branch)."

if ! git diff --quiet || ! git diff --cached --quiet; then
  git status --short
  fail "Des fichiers suivis par git ont été modifiés sur le serveur : corrige-les avant de déployer."
fi

# --- 1. Arrêt de l'app --------------------------------------------------------
# Sur NFS, un processus Next encore actif verrouille node_modules (erreurs ENOTEMPTY/EBUSY) :
# on attend qu'il soit réellement terminé avant de toucher aux dépendances.
step "Arrêt de l'application"
if pgrep -u "$USER" -f "next start|next-server" >/dev/null; then
  pkill -u "$USER" -f "next start|next-server" || true
  for _ in $(seq 1 15); do
    pgrep -u "$USER" -f "next start|next-server" >/dev/null || break
    sleep 1
  done
  if pgrep -u "$USER" -f "next start|next-server" >/dev/null; then
    pkill -9 -u "$USER" -f "next start|next-server" || true
    sleep 1
  fi
  echo "Application arrêtée."
else
  echo "Aucune instance en cours."
fi

# --- 2. Récupération du code --------------------------------------------------
step "Récupération du code (git pull)"
before="$(git rev-parse HEAD)"
git pull --ff-only
after="$(git rev-parse HEAD)"
if [ "$before" = "$after" ]; then
  echo "Déjà à jour ($(git log -1 --format='%h %s'))."
else
  git log --oneline "$before..$after"
fi

# --- 3. Dépendances -----------------------------------------------------------
step "Dépendances"
need_install=false
if [ ! -d node_modules ]; then
  need_install=true
elif ! git diff --quiet "$before" "$after" -- package.json package-lock.json; then
  need_install=true
fi

if [ "$need_install" = true ]; then
  # node_modules est déplacé hors du projet plutôt que supprimé : sur NFS, un fichier
  # .nfsXXXX encore verrouillé empêche la suppression, mais pas le déplacement.
  # (Hors du projet, sinon TypeScript analyse ses sources pendant le build.)
  if [ -d node_modules ]; then
    mkdir -p "$TRASH"
    mv node_modules "$TRASH/node_modules.$(date +%s)"
  fi
  npm ci
  rm -rf "$TRASH" 2>/dev/null || echo "(Ancien node_modules encore verrouillé dans $TRASH : il sera supprimé au prochain déploiement.)"
else
  echo "package.json et package-lock.json inchangés : npm ci inutile."
  npx prisma generate >/dev/null
fi

# --- 4. Migrations ------------------------------------------------------------
step "Migrations de la base (prisma migrate deploy)"
npm run db:deploy

# --- 5. Build -----------------------------------------------------------------
step "Build de production"
npm run build

# --- 6. Redémarrage -----------------------------------------------------------
step "Démarrage sur le port $PORT"
nohup npm start -- -p "$PORT" >"$LOG" 2>&1 &

for _ in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT" || true)"
  case "$code" in
    2??|3??) break ;;
  esac
  sleep 1
done

case "$code" in
  2??|3??)
    printf '\n\033[1;32m✓ Déployé : %s sur le port %s (HTTP %s).\033[0m\n' "$(git log -1 --format='%h')" "$PORT" "$code"
    echo "Tunnel depuis ta machine : ssh -L 3002:$(hostname -s):$PORT $USER@pedago.univ-avignon.fr"
    ;;
  *)
    tail -20 "$LOG"
    fail "L'application ne répond pas sur le port $PORT (voir $LOG)."
    ;;
esac
