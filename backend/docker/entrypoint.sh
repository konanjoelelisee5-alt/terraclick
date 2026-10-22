#!/bin/sh
# Démarrage de l'API sur Render : port, certificat MySQL, caches, migrations, puis Apache.
set -e

# Render indique le port à écouter dans $PORT.
PORT="${PORT:-10000}"
sed -ri "s/Listen [0-9]+/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:[0-9]+>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

# Base MySQL externe (Aiven) : son certificat d'autorité est fourni en variable d'environnement.
if [ -n "$MYSQL_SSL_CA_PEM" ]; then
  printf '%s\n' "$MYSQL_SSL_CA_PEM" > /tmp/mysql-ca.pem
  export MYSQL_ATTR_SSL_CA=/tmp/mysql-ca.pem
fi

php artisan config:cache
php artisan route:cache
php artisan migrate --force

php artisan storage:link || true

# Référentiels (catalogue, prestations, rôles et permissions) et, pour la phase de test, données de
# démonstration (SEED_ON_DEPLOY=true ; à passer à false au lancement réel). Chargés en arrière-plan,
# et seulement s'ils ont changé depuis le dernier chargement : l'API répond dès le démarrage, au
# lieu d'attendre plusieurs minutes que tout soit rejoué vers la base distante.
DEMO=""
if [ "$SEED_ON_DEPLOY" = "true" ]; then
  DEMO="--demo"
fi
( php artisan terraclick:amorcer $DEMO || echo "terraclick:amorcer a échoué" ) &

exec apache2-foreground
