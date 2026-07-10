# AGENT.md

> Generic instructions for any AI coding agent (Claude Code, OpenCode/gstack, etc.)
> working in any of my repos. Copy this into a project root and fill in Section 1.

## 1. Project Context

- **Project**: Engram
- **Purpose**: Spaced repetition DSA tracker for serious interview prep.
- **Stack**: <languages, frameworks, DB, infra>
- **Docs-first policy**: Before writing feature code, check for (and if missing,
  draft) in this order: PRD → SAD (System Architecture Doc) → domain model →
  API spec. If a relevant doc exists in `/docs`, read it before touching
  related code.
- **Non-goals**: <things intentionally out of scope, so the agent doesn't
  "helpfully" add them>

## 2. How I Want to Work (Efficiency)

- **Plan before executing.** For anything beyond a trivial fix, output a short
  numbered plan (files touched, approach, tradeoffs) and wait for a go-ahead
  on anything non-trivial or irreversible.
- **Batch your context-gathering.** Read all the files you'll plausibly need
  before starting to write, rather than reading one file, writing a bit,
  realizing you need another file, and repeating. Fewer, larger tool-call
  batches beat many small ones.
- **Don't re-explore what you already know.** If you've already read a file
  or run a command earlier in this session, use that result instead of
  re-fetching it, unless the file could have changed since.
- **Work at the right grain.** Don't refactor, rename, or reformat code that
  isn't part of the task, even if you spot something you'd do differently —
  mention it separately instead of folding it into the diff.
- **Prefer small, reviewable diffs** over large rewrites. If a task naturally
  splits into stages, do it in stages with a checkpoint between each.
- **Match existing patterns** in the codebase (naming, folder structure, error
  handling style) rather than introducing a new convention mid-project.
- **Justify new dependencies** before adding one — state why the standard
  library or an existing dependency can't do it, and confirm before
  installing.
- **Parallelize independent work.** If a task has parts that don't depend on
  each other (e.g. writing a test file and updating docs), do them in the
  same pass instead of sequentially waiting on each other.
- **Don't gold-plate.** Build the simplest version that satisfies the actual
  request; don't add configurability, extra options, or edge-case handling
  for cases I didn't ask about — flag them as follow-ups instead.
- Run the linter/formatter/tests after every change set, not just at the end,
  so failures are caught while context is still fresh.
- Keep a running changelog entry or commit message draft that explains *why*,
  not just *what* — even though you won't commit it yourself (see Section 4).

## 3. How I Want to Learn While You Code

I build projects to develop intuition, not just to ship working code. So:

- **Explain before you generate.** Before writing non-trivial logic (a new
  algorithm, a tricky query, an architectural pattern), give a short
  explanation of the approach and *why* it's the right one — as if teaching
  me, not just logging your reasoning.
- **Flag the interesting parts.** When code involves a non-obvious tradeoff,
  call it out explicitly with a one-line rationale.
- **Prefer teaching idioms over black-box snippets.** If there are two
  reasonable ways to do something, briefly mention the alternative and why
  you picked one.
- **Don't over-abstract early.** Default to the simplest version that works;
  don't introduce design patterns or generalizations I didn't ask for, since
  that hides the learning in premature abstraction.
- When I ask "why did you do it this way," treat that as a normal part of the
  workflow, not a challenge to defend — just explain.

## 4. Git — Never Without Explicit Permission

- **Never run `git commit`, `git push`, or `git merge` unless I explicitly ask
  for it in that moment.** Finishing a task, passing tests, or me saying
  "looks good" is not permission to commit or push — I'll say so directly
  when I want that ("commit this", "push it").
- This applies even if you were the one who created the changes, even for
  small fixes, and even if a previous message in this session mentioned
  committing later.
- You *can* freely: create/modify files, run `git diff`, `git status`,
  `git log`, `git add` if asked to stage (but not commit), and create a
  branch if I ask — staging or branching isn't the same as committing.
- If you think a commit is a good checkpoint, say so and propose a commit
  message — but stop there and wait for my go-ahead.
- Never force-push, rewrite shared history, or auto-merge a PR under any
  circumstance, permission or not — ask every time for these regardless.

## 5. Safety & Critical Instructions

**Never do the following without explicit, in-the-moment confirmation:**

- Delete or drop data: `DROP TABLE`, `DELETE FROM ...` without a `WHERE`,
  `rm -rf`, or clearing a Docker **named volume**. Recall: for code-only
  redeploys, `docker compose build --no-cache` + `docker compose up -d
  --no-deps` is the safe pattern — never touch the DB volume.
- Modify or deploy against **production** (env vars, secrets, prod DB
  connection strings, prod infra via Terraform/K8s). Always confirm which
  environment a command targets before running it.
- Commit secrets, API keys, `.env` files, or credentials. Assume anything in
  `.env` is sensitive; use `.env.example` for placeholders only.
- Install packages from unverified/low-download sources, or run scripts piped
  from the internet (`curl | sh` style) without showing me the script first.

**Always do the following:**

- Validate and sanitize any user input path that reaches a DB query, shell
  command, or file path (SQL injection / path traversal / command injection
  awareness by default, not just when asked).
- Point out if a requested change would introduce a security regression (e.g.
  disabling CORS checks, weakening auth, logging sensitive fields) — even if
  I didn't ask about security for that task.
- Keep secrets out of logs, error messages, and client-side bundles.
- Note any breaking change (API contract, DB schema, config format) explicitly
  before applying it, and suggest a migration path.

## 6. Testing & Verification

- New logic gets a test unless I explicitly say "skip tests for this."
- Prefer tests that describe *behavior* (given/when/then) over tests that
  just mirror the implementation.
- Before declaring a task "done," run the test suite and linter and report
  the actual result — don't assume it passes.

## 7. Communication Style

- Be direct about tradeoffs and risks; don't just agree with my approach if
  there's a better one — say so, briefly, with reasoning.
- If a request is ambiguous, state the assumption you're making and proceed,
  rather than stalling — but flag it clearly so I can correct it.
- Summarize what changed and why at the end of a task, not a blow-by-blow of
  every tool call.