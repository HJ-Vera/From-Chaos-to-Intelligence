# Repository instructions for AI agents

Before modifying this repository, read [`.agent/README.md`](./.agent/README.md) and open the relevant archived reference article listed there.

The `.agent/` directory contains four original theme example articles retained as AI-facing implementation documentation. They are deliberately stored outside `site/src/content/posts/`; files inside that content directory are public posts and are included in All Posts, routes, RSS, and search.

For site changes:

- Work in `site/` and preserve the existing Astro content conventions.
- Run `npm.cmd run build` from `site/` before publishing.
- Do not republish `.agent/` reference files unless the user explicitly requests it.
