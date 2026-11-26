#!/usr/bin/env bash
# Deterministic gate. Baseline measured 2026-11-26: typecheck, test, build green; eslint 5 errors (ratchet).
set -u
cd "$(git rev-parse --show-toplevel)"
mkdir -p loop/state; rc=0
[ -d node_modules ] || npm install --legacy-peer-deps --no-package-lock --no-audit --no-fund || { echo "!! install failed"; exit 1; }
step() { echo "== $*"; "$@" || { echo "!! $* FAILED"; rc=1; }; }
step npm run -s typecheck
step timeout 300 npm run -s test
step timeout 300 npm run -s build

# lint ratchet: error count may never go up (it may go down; loop.sh then lowers the baseline)
base=$(cat loop/LINT_BASELINE 2>/dev/null || echo 0)
cnt=$(npx eslint . -f json 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).reduce((a,x)=>a+x.errorCount,0))}catch{console.log(999999)}})")
echo "== eslint errors: $cnt (baseline $base)"; echo "$cnt" > loop/state/lint-count
[ "$cnt" -gt "$base" ] && { echo "!! eslint errors rose above baseline"; rc=1; }

# slop gate: no NEW emoji in added source lines (existing ones are tolerated)
node -e "
const {execSync}=require('child_process'),fs=require('fs');
const re=/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B55}]/u;
let added=execSync('git diff HEAD -U0 -- src',{encoding:'utf8',maxBuffer:1<<26}).split('\n').filter(l=>l[0]=='+'&&l[1]!='+');
for(const f of execSync('git ls-files --others --exclude-standard -- src',{encoding:'utf8'}).split('\n').filter(Boolean)) added.push(...fs.readFileSync(f,'utf8').split('\n'));
const bad=added.filter(l=>re.test(l)); if(bad.length){console.log('!! new emoji in source (use lucide icons):');bad.slice(0,5).forEach(l=>console.log('  '+l.trim()));process.exit(1)}" || rc=1
exit $rc
