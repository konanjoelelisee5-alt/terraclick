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

# Référentiels et données de démonstration. Les seeders sont rejouables : relancer ne duplique rien.
if [ "$SEED_ON_DEPLOY" = "true" ]; then
  php artisan db:seed --force
fi

php artisan storage:link || true

exec apache2-foreground
