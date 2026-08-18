#!/usr/bin/env bash
set -euo pipefail

npm install --include=dev
npm run optimize-media

pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

