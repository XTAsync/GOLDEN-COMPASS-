# The Golden Compass loop

An unattended loop (`bash loop/loop.sh`) works through `loop/TASKS.md` one task at a time. The tracker is its memory and audit trail.

## How a task flows
1. `tracker.mjs sync` makes every open task a `todo` issue (labels `loop`, `skip-docs`; `needs-human` for risk:high).
2. The loop sets the task's issue `in-progress` (this also satisfies the `require-issue` hook), then runs the worker (Claude) with limited tools.
3. Gates, in order: worker changed something -> `guard.sh` (protected paths, secrets, file-count cap) -> `check.sh` (typecheck, tests, build, eslint ratchet, no new emoji) -> independent read-only verifier (`VERDICT: PASS`).
4. Pass: tracker comment with the worker's 3-line summary, issue moves to `review`, task ticked `[x]`, one commit `loop(T01): title [GC-in-1]`. A human moves it to `done`.
5. Fail: revert to the base commit, comment the failure on the issue, retry (max 3, with the failure as feedback). Then the task is `[!]` blocked and its issue returns to `backlog`.

## What the loop will never do
Change migrations, env, CI, lockfiles, money/auth server code, M-Pesa routes, docs, `.claude/`, tracker internals or its own scripts. `risk:high` tasks (money, RLS, M-Pesa, prod DB) stop the loop for a human.

## Stops
No open tasks; 15 iterations; 3 hours; 3 failures in a row; a risk:high task; `touch loop/STOP`.

## Where to look
`loop/README.md` (commands), `loop/TASKS.md` (queue), `loop/PROGRESS.md` (standing notes), `loop/runs/` (per-attempt logs, git-ignored).
