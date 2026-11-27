# Golden Compass loop (wired to Claude Project Tracker)

    bash loop/loop.sh                 # run
    DRY_RUN=1 bash loop/loop.sh       # show the next task
    touch loop/STOP                   # kill switch
    MAX_ITERS=5 MAX_SECONDS=3600 bash loop/loop.sh
    node loop/tracker.mjs sync        # create todo issues for open tasks

Details: `.project/wiki/pages/loop.md`. Needs: bash, git, node, `claude` CLI, `timeout`. Run on a clean tree; it works on branch `claude/loop`, never `main`.
Verify CLI flags first with `claude --help` (-p, --max-turns, --allowedTools, --disallowedTools, --permission-mode).
Exit codes: 0 done/budget, 2 preflight, 3 stuck, 4 human needed, 5 Claude usage limit (attempt not counted; rerun after reset).
