#!/usr/bin/env bash
# Golden Compass loop: task -> tracker issue -> worker -> guard -> check -> verifier -> commit/revert.
# Run from the repo root:  bash loop/loop.sh
# Env: MAX_ITERS(15) MAX_SECONDS(10800) MAX_ATTEMPTS(3) MAX_TURNS(40) CLAUDE_BIN(claude) DRY_RUN(0) LOOP_BRANCH(claude/loop)
set -uo pipefail
ROOT="$(git rev-parse --show-toplevel)" || { echo "not a git repo"; exit 2; }
cd "$ROOT"
L=loop
MAX_ITERS="${MAX_ITERS:-15}"; MAX_SECONDS="${MAX_SECONDS:-10800}"; MAX_ATTEMPTS="${MAX_ATTEMPTS:-3}"
MAX_TURNS="${MAX_TURNS:-40}"; CLAUDE_BIN="${CLAUDE_BIN:-claude}"; BRANCH="${LOOP_BRANCH:-claude/loop}"
RUNS="$L/runs"; ST="$L/state"; mkdir -p "$RUNS" "$ST"
EXCL=(':!loop/runs' ':!loop/state' ':!.project')   # loop-owned / tracker paths are not "worker changes"
START=$(date +%s)
log()  { echo "[$(date +%H:%M:%S)] $*" | tee -a "$RUNS/loop.log"; }
stop() { log "STOP: $1"; echo "$1" > "$ST/LAST_STOP"; exit "${2:-0}"; }
trk()  { node "$L/tracker.mjs" "$@" 2>>"$RUNS/tracker.err" || log "tracker call failed: $*"; }

[ -f "$L/STOP" ] && stop "kill switch file loop/STOP present"
[ -d .project ] || stop ".project/ missing: install Claude Project Tracker first" 2
[ -n "$(git status --porcelain -- . "${EXCL[@]}")" ] && stop "working tree not clean; commit or stash first (failed attempts are reverted)" 2
case "$(git rev-parse --abbrev-ref HEAD)" in main|master|production) git checkout -B "$BRANCH" || exit 2 ;; esac

next_task() { grep -m1 -E '^- \[ \] ' "$L/TASKS.md" || true; }
field()     { echo "$1" | awk -F'|' -v n="$2" '{gsub(/^ +| +$/,"",$n); print $n}'; }
mark()      { sed -i -E "s/^- \[ \] ($1) /- [$2] \1 /" "$L/TASKS.md"; }
commit_all(){ git add -A -- . ':!loop/runs' ':!loop/state' 2>/dev/null; git commit -qm "$1

Co-Authored-By: Claude <noreply@anthropic.com>" ; }

trk sync >/dev/null   # make sure every open task exists as a todo issue on the board

i=0; fails_in_row=0
while :; do
  i=$((i+1))
  [ "$i" -gt "$MAX_ITERS" ] && stop "iteration cap $MAX_ITERS reached"
  [ $(( $(date +%s) - START )) -gt "$MAX_SECONDS" ] && stop "time budget ${MAX_SECONDS}s spent"
  [ -f "$L/STOP" ] && stop "kill switch file loop/STOP present"
  [ "$fails_in_row" -ge 3 ] && stop "3 failed iterations in a row: needs a human" 3

  line="$(next_task)"; [ -z "$line" ] && stop "no open tasks: DONE"
  id="$(echo "$line" | sed -E 's/^- \[ \] ([A-Za-z0-9_-]+).*/\1/')"
  title="$(field "$line" 2)"; crit="$(field "$line" 3)"
  maxfiles="$(echo "$line" | grep -oE 'max-files:[0-9]+' | cut -d: -f2)"; export MAX_FILES="${maxfiles:-25}"

  if echo "$line" | grep -q 'risk:high'; then
    trk ensure "$id" "$title" "$crit" "loop,needs-human" >/dev/null
    echo "$line" > "$ST/HUMAN_NEEDED"
    stop "task $id is risk:high (money / RLS / M-Pesa / prod DB). Do it with a human, then tick it in loop/TASKS.md" 4
  fi

  att_file="$ST/attempts-$id"; att=$(( $(cat "$att_file" 2>/dev/null || echo 0) + 1 ))
  if [ "$att" -gt "$MAX_ATTEMPTS" ]; then
    log "task $id exceeded $MAX_ATTEMPTS attempts -> blocked"
    trk comment "$id" "Blocked after $MAX_ATTEMPTS failed attempts. See loop/runs/ and the last failure note; needs a human." >/dev/null
    trk status "$id" backlog >/dev/null; mark "$id" '!'; rm -f "$att_file"
    commit_all "loop($id): blocked after $MAX_ATTEMPTS attempts" || true; continue
  fi
  echo "$att" > "$att_file"
  base=$(git rev-parse HEAD)
  rd="$RUNS/$(date +%Y%m%d-%H%M%S)-$id-a$att"; mkdir -p "$rd"
  [ "${DRY_RUN:-0}" = 1 ] && { log "DRY_RUN: would run $id ($title) max-files=$MAX_FILES"; rm -f "$att_file"; exit 0; }

  issue="$(trk start "$id" "$title" "$crit")"   # in-progress issue also satisfies the tracker's require-issue hook
  log "iter $i | $id | attempt $att | issue $issue | base ${base:0:7}"

  fail() { # $1 reason, $2 which *.out holds the detail
    log "FAIL ($1)"
    { echo "Attempt $att failed: $1"; tail -n 40 "$rd/${2:-check}.out" 2>/dev/null; } > "$ST/feedback-$id"
    git reset -q --hard "$base"; git clean -fdq -- . "${EXCL[@]}"
    trk start "$id" "$title" "$crit" >/dev/null          # reset may have reverted the tracked issue file
    trk comment "$id" "Attempt $att failed: $1" >/dev/null
    echo "- $(date +%F) $id attempt $att FAILED: $1" >> "$ST/progress.log"
    fails_in_row=$((fails_in_row+1))
  }

  wprompt="$(cat "$L/prompts/worker.md")

## Tracker issue (already open and in-progress; do not create or edit issues)
$issue

## Your task (only this one)
$line

## Standing notes
$(cat "$L/PROGRESS.md")
$(tail -n 30 "$ST/progress.log" 2>/dev/null)

## Feedback from the last failed attempt at this task (empty if first attempt)
$(cat "$ST/feedback-$id" 2>/dev/null)"
  timeout 1800 "$CLAUDE_BIN" -p "$wprompt" --max-turns "$MAX_TURNS" --permission-mode acceptEdits \
    --allowedTools "Read,Edit,Write,Grep,Glob,Bash(git status:*),Bash(git diff:*),Bash(npm run:*),Bash(npx tsc:*),Bash(npx vitest:*),Bash(npx eslint:*),Bash(npx prettier:*),Bash(ls:*),Bash(cat:*)" \
    --disallowedTools "Bash(git push:*),Bash(git reset:*),Bash(git checkout:*),Bash(git commit:*),Bash(rm -rf:*),Bash(curl:*),Bash(supabase:*),Bash(npm install:*)" \
    > "$rd/worker.out" 2>&1
  log "worker exit $?"

  [ -z "$(git status --porcelain -- . "${EXCL[@]}")" ] && { fail "worker made no changes" worker; continue; }
  bash "$L/guard.sh" > "$rd/guard.out" 2>&1 || { fail "guard: $(grep -m1 -E 'PROTECTED|TOO MANY|SECRET' "$rd/guard.out")" guard; continue; }
  bash "$L/check.sh" > "$rd/check.out" 2>&1 || { fail "check.sh failed: $(grep -m2 '^!!' "$rd/check.out" | tr '\n' ' ')" check; continue; }

  git add -A -- . "${EXCL[@]}" 2>/dev/null
  vprompt="$(cat "$L/prompts/verifier.md")

## Task that was assigned
$line

## Diff to review
$(git diff --cached --stat)
$(git diff --cached | head -c 60000)"
  timeout 900 "$CLAUDE_BIN" -p "$vprompt" --max-turns 10 --allowedTools "Read,Grep,Glob" > "$rd/verifier.out" 2>&1
  if ! tail -n 5 "$rd/verifier.out" | grep -q '^VERDICT: PASS'; then
    git reset -q; fail "verifier rejected: $(grep -m3 -E '^- ' "$rd/verifier.out" | tr '\n' ' ')" verifier; continue
  fi

  # the SCRIPT closes the task: tick it, ratchet lint baseline, move the issue to review (human confirms done)
  [ -f "$ST/lint-count" ] && [ "$(cat "$ST/lint-count")" -lt "$(cat "$L/LINT_BASELINE")" ] && cp "$ST/lint-count" "$L/LINT_BASELINE"
  summary="$(tail -c 560 "$rd/worker.out" | tr -s '\n' ' ')"
  trk comment "$id" "Verified by loop (attempt $att). $summary" >/dev/null
  trk status "$id" review >/dev/null
  mark "$id" x
  echo "- $(date +%F) $id DONE (attempt $att)" >> "$ST/progress.log"
  commit_all "loop($id): $title [$issue]" && log "committed $id [$issue]"
  rm -f "$ST/feedback-$id" "$att_file"; fails_in_row=0
done
