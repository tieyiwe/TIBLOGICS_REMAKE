@AGENTS.md

# Delivery routine (owner's standing instruction)

Every piece of work, without being asked, ends with these steps in this order:

1. **Test end to end.** Production build (`npm run build`), type check (`npx tsc --noEmit -p .`), and a real browser run of the changed flows (Playwright) as each affected role: visitor, learner, team member, admin. Check EN and FR, desktop and 390px.
2. **Find and fix bugs.** Fix whatever the tests surface, then re-run until clean. Never report a failing test as passing.
3. **Security check** of the new or changed code (auth on every route, IDOR, input validation, injection, secrets, rate limits, AI spend). Fix confirmed issues.
4. **Commit and push** to the working branch.
5. **Give the owner the deploy steps:** exact Replit Shell commands, new or changed Secrets, scheduled jobs, Stripe or Google settings, and one-time admin actions. Always include the database step before Republish:
   ```
   git pull origin <branch>
   npm install
   npm run build
   # Stop, then Run in the workspace
   CRON_BASE_URL=http://localhost:5000 npm run cron dbprep
   # then Republish
   ```
   New runtime tables must be added to `prisma/schema.prisma` and to the STEPS list in `app/api/cron/db-prepare/route.ts`, or Replit's publish will try to drop production tables.

Never tell the owner to run unfinished work: name the last tested commit if the branch has work in progress.
