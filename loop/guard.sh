#!/usr/bin/env bash
# Fails if the worker touched anything unattended agents must never change.
set -u
cd "$(git rev-parse --show-toplevel)"
changed=$( { git diff --name-only HEAD; git ls-files --others --exclude-standard; } | sort -u \
  | grep -vE '^(loop/(runs|state)|\.project/(issues|counters|wiki/_index\.json))/?' || true )
bad=0
while read -r pat; do
  case "$pat" in ''|\#*) continue;; esac
  hit=$(echo "$changed" | grep -E "$pat" || true)
  [ -n "$hit" ] && { echo "PROTECTED PATH TOUCHED ($pat): $hit"; bad=1; }
done < loop/PROTECTED_PATHS
n=$(echo "$changed" | grep -c . || true); max="${MAX_FILES:-25}"
[ "$n" -gt "$max" ] && { echo "TOO MANY FILES CHANGED ($n > $max)"; bad=1; }
if git diff HEAD | grep -E '^\+' | grep -Eiq '(sk_live|service_role|SUPABASE_SERVICE|consumer_secret|passkey|BEGIN (RSA|PRIVATE)|MPESA_CALLBACK_SECRET *= *["'\'']?[A-Za-z0-9])'; then
  echo "POSSIBLE SECRET IN DIFF"; bad=1
fi
[ "$bad" = 0 ] && echo "guard ok ($n files)"
exit "$bad"
