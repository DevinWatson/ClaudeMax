---
name: express-framework
description: Use when working in Express (Node.js, versions 4/5, typically TypeScript) — the middleware pipeline and ordering, routing and Router composition, the request/response lifecycle, error-handling middleware (the 4-argument signature) and async error propagation, body parsing and validation (zod / express-validator), auth middleware (passport/JWT), security middleware (helmet, cors, rate limiting), structured errors, layering routes/controllers/services, TypeScript typing of req/res/handlers, and graceful shutdown. Verifies with tsc, app startup, jest/vitest + supertest, and eslint. TRIGGER on Express middleware-ordering bugs, Router wiring, an error handler not catching async rejections, body parsing/validation, auth/JWT or helmet/cors/rate-limit middleware, error-envelope design, or typed handlers. NOT for general TypeScript type-system concerns (that is typescript-type-system), NOT for framework-agnostic HTTP contract design, NOT for NestJS, and NOT for Next.js/Remix — Express is a standalone Node API server.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [express, nodejs, typescript, middleware, api]
version: 1.0.0
license: MIT
status: stable
maintainer: devinwatson@gmail.com
---

# Express Framework

The substantive Express capability: get the *framework* concerns right — the middleware
pipeline and its ordering, routing and `Router` composition, the request/response lifecycle,
error-handling middleware and async error propagation, body parsing and validation, auth and
security middleware, consistent error responses, layering (routes/controllers/services), typed
handlers, and graceful shutdown — and verify with the project's runner and quality gates. This
is distinct from general TypeScript language concerns (generics, inference, `tsconfig`,
module resolution), which are the domain of [[typescript-type-system]], and from
framework-agnostic HTTP contract design. It is also distinct from NestJS and from React
meta-frameworks (Next.js/Remix): Express is a standalone Node API server.

## When to use this skill

When the problem is framework-level Express behavior: middleware ordering or a handler that
never runs, `Router` wiring/mounting, a body that is `undefined` because a parser is missing,
an error handler that does not catch async rejections, request validation, an auth/JWT
middleware, helmet/cors/rate-limit configuration, the shape of error responses, the layering
of routes vs controllers vs services, typing `Request`/`Response`/`RequestHandler`, or a
graceful-shutdown question. Not for pure TypeScript type-system issues (use
[[typescript-type-system]]), framework-agnostic REST contract design (status-code discipline,
versioning, pagination semantics as a discipline), NestJS, or Next.js/Remix. Pairs with
[[match-project-conventions]] and [[verify-by-running]].

## Instructions

1. **Establish the project shape first.** Find the Express major version (`package.json` —
   **4 vs 5 differs**: Express 5 returns rejected promises from async handlers to `next`
   automatically, changes some path-to-regexp wildcard syntax, and drops a few legacy APIs),
   the Node version and module system (CommonJS `require` vs ESM `import`, `"type": "module"`),
   the package manager (npm/pnpm/yarn), the TypeScript setup (`tsconfig.json`, `ts-node`/`tsx`
   vs a build step), and how the app is assembled — the `express()` app, the `Router`s and
   their mount paths, the middleware order in `app.use(...)`, the server bootstrap
   (`app.listen` / `http.createServer`), and the validation/auth libraries in use.
2. **Order the middleware pipeline deliberately.** Express runs middleware in registration
   order; the position of each `app.use`/`router.use` is the contract. Put cross-cutting
   middleware early (request-id, logger, `helmet`, `cors`, body parsers, rate limiter), then
   routers, then a 404 handler, then the error-handling middleware **last**. Each middleware
   either ends the request (`res.send`/`res.json`/`res.end`) or calls `next()`; forgetting
   `next()` hangs the request, and calling `next()` after sending throws "headers already
   sent". Mount auth/validation before the handlers they protect.
3. **Compose routing with `Router`.** Group related routes in `express.Router()` modules and
   mount them with `app.use('/api/v1/users', usersRouter)`; keep route handlers thin and
   delegate to controllers/services. Use `router.route('/:id').get(...).put(...)` to share a
   path, declare specific paths before parameterized/wildcard ones to avoid shadowing, and
   read typed params via `req.params`/`req.query` (validate/coerce — they are strings). Apply
   route-level middleware (`router.get('/x', authMiddleware, handler)`) for per-route concerns.
4. **Understand the request/response lifecycle.** A request flows through the matched
   middleware/handlers until one writes a response. Use `res.status(code).json(body)` for
   JSON, set headers before the body, and never write twice. `res.locals` carries per-request
   data (e.g. the authenticated user) between middleware and handlers. Return early after
   `res.json(...)` so execution does not fall through to a second response.
5. **Get error handling right — the 4-argument signature and async propagation.** An
   error-handling middleware is identified by its **arity**: `(err, req, res, next)` — all
   four parameters must be present or Express treats it as a normal middleware. Register it
   **last**, after the routers. In **Express 4**, a rejected promise in an `async` handler is
   *not* caught automatically — either wrap handlers in an `asyncHandler` /
   `express-async-errors`, or `try/catch` and call `next(err)`; throwing inside a non-async
   callback after an `await` is lost. In **Express 5**, async handler rejections are forwarded
   to `next` automatically. Centralize the error response in one error-handling middleware so
   the envelope is consistent.
6. **Parse and validate request bodies.** Enable the built-in parsers (`express.json()`,
   `express.urlencoded({ extended: true })`) — without them `req.body` is `undefined`. Bound
   the payload (`express.json({ limit: '1mb' })`). **Validate every untrusted input** with
   `zod` (parse `req.body`/`req.query`/`req.params` in a validation middleware, attach the
   typed result to `res.locals`, return 400 with field errors on failure) or
   `express-validator` (validation chains + `validationResult`). Never trust client input and
   never spread it directly into a DB write (mass-assignment) — pick the allowed fields.
7. **Implement authentication middleware.** Use `passport` strategies or a hand-rolled JWT
   middleware: extract the bearer token, **verify** signature, `exp`, and issuer/audience with
   `jsonwebtoken` (never decode-without-verify), load the principal, attach it to
   `res.locals.user`/`req.user`, and `next()`; on failure return 401 with `WWW-Authenticate`.
   Enforce authorization (role/owner checks) server-side in middleware or the service layer to
   prevent IDOR — never trust a client-supplied user id. Mount auth **before** the protected
   routes, and order it correctly relative to rate limiting and validation.
8. **Add security middleware.** Apply `helmet()` early for secure headers; configure `cors`
   with an explicit allow-list of origins/methods/headers (never reflect an arbitrary origin
   together with `credentials: true`); add `express-rate-limit` (and a slow-down/lockout on
   auth routes) to blunt brute-force and abuse; disable `x-powered-by`
   (`app.disable('x-powered-by')`). Guard against prototype pollution (avoid unsafe deep-merge
   of request bodies into objects) and SSRF (never fetch a client-controlled URL without an
   allow-list).
9. **Return structured, consistent error responses.** Define a single error envelope (e.g.
   `{ error: { code, message, details? } }`) and produce it only in the central error-handling
   middleware. Map known/operational errors to their status (400/401/403/404/409/422) and
   collapse everything unexpected to a 500 with a generic message — **never leak stack traces,
   SQL, or internal messages** to the client; log the full detail server-side with the
   request id. Distinguish operational errors (expected, handled) from programmer errors.
10. **Layer routes / controllers / services.** Keep routers to wiring + middleware,
    controllers to translating HTTP ↔ domain (read validated input, call a service, shape the
    response), and services to business logic and data access (framework-agnostic, unit-
    testable). Do not put DB queries or business rules in route handlers; do not import `req`/
    `res` into the service layer. This keeps handlers thin and the core testable without HTTP.
11. **Type req/res/handlers in TypeScript.** Use `RequestHandler` (or
    `Request`/`Response`/`NextFunction` from `express`), parameterize the generics
    (`Request<Params, ResBody, ReqBody, Query>`) for typed params/body/query, and type
    `res.locals` via module augmentation of `Express.Locals` (or a typed wrapper) rather than
    `any`. For validated input prefer the type inferred from the zod schema (`z.infer`). Type
    the error-handling middleware as `ErrorRequestHandler`. Defer deeper type-system questions
    to [[typescript-type-system]].
12. **Bootstrap and shut down gracefully.** Separate the `app` (exported, testable with
    supertest) from the server bootstrap (`const server = app.listen(port)`). On `SIGTERM`/
    `SIGINT`, stop accepting new connections (`server.close()`), drain in-flight requests with
    a timeout, close DB pools/queues, then exit; also handle `unhandledRejection`/
    `uncaughtException`. This prevents dropped requests on deploy/restart.
13. **Verify with the project's runner and quality gates** via [[verify-by-running]]: run the
    typecheck (`tsc --noEmit` or the project's `typecheck` script), start the app (`node
    dist/server.js` / `ts-node` / `tsx`) to confirm it boots, run the tests (`jest`/`vitest`
    with **supertest** driving the exported `app`), and run `eslint`, in the project's
    environment (npm/pnpm/yarn). Report the exact commands and real results.

## Inputs

- The Express major version and the project config (`package.json` with scripts, dependency
  manager, module system; `tsconfig.json`; configured eslint and test runner), the relevant
  `app`/server bootstrap, the `Router` modules and their mount order, the middleware stack,
  validation schemas, auth/security middleware, controllers/services, and the full error text
  or stack trace / failing request-response for anything being diagnosed.

## Output

- The framework-level cause (middleware ordering, Router wiring, async error not propagated,
  missing/incorrect parser or validation, auth/security middleware, error envelope, layering,
  handler typing, graceful shutdown) and the change as a focused diff, with a one-line
  rationale per non-obvious choice.
- The typecheck/startup/test/lint results via [[verify-by-running]], with the exact commands.

## Notes

- **Express 4 vs 5 is the biggest correctness trap for async errors.** In Express 4 a rejected
  promise in an `async` handler is *not* routed to the error middleware unless you wrap it
  (`asyncHandler`/`express-async-errors`); confirm the major version before relying on
  automatic propagation.
- **Middleware order is the contract.** A handler that "never runs", a `req.body` that is
  `undefined`, or an error middleware that is ignored is almost always an ordering problem:
  parsers and auth must precede the routes; the 404 and the 4-arg error handler come last.
- **The error-handling middleware is identified by arity** — it must declare all four
  parameters `(err, req, res, next)`, even if `next` is unused, or Express won't treat it as
  an error handler.
- **Never leak internals**: collapse unexpected errors to a generic 500 and keep stack traces
  server-side. Validate and allow-list input to avoid mass-assignment, prototype pollution,
  and SSRF.
- General TypeScript concerns — generics, inference, `tsconfig`/module resolution — belong to
  [[typescript-type-system]], not here. Framework-agnostic HTTP contract design (status-code
  discipline, versioning, pagination semantics) is a separate REST API design concern.
