#!/usr/bin/env node
// Bridges the loop to Claude Project Tracker (.project/). Mirrors the formats the tracker skills write.
// Usage: node loop/tracker.mjs start|ensure <TID> "<title>" "<detail>" [label,label]
//        node loop/tracker.mjs comment <TID> "<text>"
//        node loop/tracker.mjs status <TID> <backlog|todo|in-progress|review|done>
//        node loop/tracker.mjs sync            (create todo issues for every open task in loop/TASKS.md)
// An issue is found by its title prefix "[T01] ". Prints the issue id.
import fs from 'node:fs'; import path from 'node:path';
const P = path.join(process.cwd(), '.project');
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const W = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n'); };
const cfg = J(path.join(P, 'config.json'));
const slug = process.env.PROJECT_SLUG || cfg.team?.[0]?.slug || 'in';
const email = process.env.USER_EMAIL || cfg.team?.[0]?.email || 'unassigned';
const now = () => new Date().toISOString();
const issuesDir = path.join(P, 'issues');

function find(tid) {
  if (!fs.existsSync(issuesDir)) return null;
  for (const d of fs.readdirSync(issuesDir)) {
    const f = path.join(issuesDir, d, 'issue.json');
    if (!fs.existsSync(f)) continue;
    const i = J(f);
    if (i.title?.startsWith(`[${tid}] `)) return { dir: path.join(issuesDir, d), file: f, issue: i };
  }
  return null;
}
function reindex(i) {
  const f = path.join(P, 'issues_index.json');
  let idx = []; try { idx = J(f); } catch {}
  const e = { id: i.id, title: i.title, type: i.type, status: i.status, priority: i.priority, assignee: i.assignee,
              labels: i.labels, parent: i.parent ?? null, created: i.created, updated: i.updated };
  idx = idx.filter((x) => x.id !== i.id); idx.push(e);
  idx.sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
  W(f, idx);
}
function create(tid, title, detail, status, labels) {
  const cf = path.join(P, 'counters', `${slug}.json`);
  let c = { nextId: 1 }; try { c = J(cf); } catch {}
  const id = `${cfg.prefix}-${slug}-${c.nextId}`;
  const t = now();
  const issue = { id, title: `[${tid}] ${title}`, type: 'task', status, priority: 'medium', assignee: email,
                  labels, parent: null, created: t, updated: t };
  const dir = path.join(issuesDir, id);
  W(path.join(dir, 'issue.json'), issue);
  fs.writeFileSync(path.join(dir, 'description.md'), `# ${issue.title}\n\n## What was requested\n${detail}\n\nManaged by the loop (loop/TASKS.md).\n`);
  W(cf, { nextId: c.nextId + 1 });
  reindex(issue);
  return id;
}
function setStatus(tid, status) {
  const r = find(tid); if (!r) throw new Error(`no issue for ${tid}`);
  r.issue.status = status; r.issue.updated = now(); W(r.file, r.issue); reindex(r.issue); return r.issue.id;
}
function comment(tid, text) {
  const r = find(tid); if (!r) throw new Error(`no issue for ${tid}`);
  const cdir = path.join(r.dir, 'comments'); fs.mkdirSync(cdir, { recursive: true });
  const n = String(fs.readdirSync(cdir).filter((x) => x.endsWith('.json')).length + 1).padStart(3, '0');
  W(path.join(cdir, `${n}.json`), { id: n, author: 'Claude Code', content: text.slice(0, 600), created: now() });
  r.issue.updated = now(); W(r.file, r.issue); reindex(r.issue); return r.issue.id;
}
function parse(line) { // "- [ ] T01 | title | criteria | risk:low ..."
  const m = line.match(/^- \[(.)\] ([A-Za-z0-9_-]+) \| ([^|]*)\|([^|]*)\|(.*)$/);
  return m && { mark: m[1], tid: m[2], title: m[3].trim(), crit: m[4].trim(), rest: m[5].trim() };
}

const [cmd, tid, a, b, c] = process.argv.slice(2);
try {
  if (cmd === 'start' || cmd === 'ensure') {
    const labels = (c || 'loop,skip-docs').split(',');
    let r = find(tid);
    const id = r ? r.issue.id : create(tid, a, b || '', cmd === 'start' ? 'in-progress' : 'todo', labels);
    if (r && cmd === 'start' && r.issue.status !== 'in-progress') setStatus(tid, 'in-progress');
    console.log(id);
  } else if (cmd === 'comment') console.log(comment(tid, a));
  else if (cmd === 'status') console.log(setStatus(tid, a));
  else if (cmd === 'sync') {
    for (const line of fs.readFileSync('loop/TASKS.md', 'utf8').split('\n')) {
      const t = parse(line); if (!t || t.mark !== ' ' || find(t.tid)) continue;
      const labels = t.rest.includes('risk:high') ? 'loop,needs-human' : 'loop,skip-docs';
      console.log(create(t.tid, t.title, t.crit, 'todo', labels.split(',')), t.tid);
    }
  } else { console.error('unknown command'); process.exit(2); }
} catch (e) { console.error('tracker:', e.message); process.exit(1); }
