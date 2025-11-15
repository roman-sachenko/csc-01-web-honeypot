# AGENTS.md

This document describes how automated agents and contributors should work with this codebase.

---

## 1. Runtime, language & module system

- **Runtime:** Node.js `v24`
- **Package manager:** `pnpm`
- **Module system:** **ESM only**
  - Use `import` / `export` syntax.
  - No `require`, `module.exports`, or CommonJS patterns.
- **Entry point:** `src/` is the root of all application code.
  - Main entry file should live under `src/` (for example, `src/index.js`).

---

## 2. Setup & common commands

Agents should assume these are the canonical commands:

- **Install dependencies**

  ```bash
  pnpm install

pnpm dev
