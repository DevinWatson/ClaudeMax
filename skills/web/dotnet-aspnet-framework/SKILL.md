---
name: dotnet-aspnet-framework
description: Use when working in ASP.NET Core (C#) — minimal APIs vs MVC controllers, dependency injection and service lifetimes (singleton/scoped/transient), the middleware pipeline and ordering, model binding and validation, Entity Framework Core (DbContext, LINQ, migrations, N+1/Include, change tracking), authentication/authorization (JWT bearer, authorization policies, ASP.NET Core Identity), configuration and the options pattern, MVC/endpoint filters and minimal-API endpoint filters, async and IAsyncEnumerable, and health checks. Verifies with dotnet build/test, dotnet ef migrations, and dotnet format. TRIGGER on DI lifetime/captive-dependency bugs, middleware-order problems, model-binding/validation issues, EF Core query/N+1/tracking/migration problems, JWT/policy authorization gaps, or options/configuration binding. NOT for general C# language concerns (async/await deadlocks, LINQ deferred execution, nullable reference types, csproj/NuGet — that is csharp-idioms) or framework-agnostic HTTP contract design.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [dotnet, aspnet-core, efcore, dependency-injection, middleware, web]
version: 1.0.0
license: MIT
status: stable
maintainer: devinwatson@gmail.com
---

# ASP.NET Core Framework

The substantive ASP.NET Core capability: get the *framework* concerns right — the endpoint model
(minimal APIs vs MVC controllers), dependency injection and service lifetimes, the middleware
pipeline, model binding and validation, Entity Framework Core and its query behavior,
authentication/authorization, configuration and the options pattern, filters, async streaming, and
health checks — and verify with the .NET CLI. This is distinct from general C# language concerns
(async/await deadlocks, LINQ deferred execution, nullable reference types, csproj/NuGet conflicts),
which are the domain of [[csharp-idioms]].

## When to use this skill
When the problem is framework-level ASP.NET Core behavior: a DI lifetime or captive-dependency
failure, a middleware-ordering bug, a model-binding or validation issue, an EF Core
query/N+1/change-tracking/migration problem, a JWT or authorization-policy gap, options/configuration
binding, an MVC or minimal-API endpoint filter, async `IAsyncEnumerable` streaming, or a health
check. Not for pure C# idioms (use [[csharp-idioms]]) or framework-agnostic HTTP contract design
(status codes, error envelopes, versioning). Pairs with [[match-project-conventions]] and
[[verify-by-running]].

## Instructions
1. **Establish the project shape first.** Find the target framework (`net8.0`/`net9.0`) and SDK in
   the `.csproj`/`Directory.Build.props`, the `<Nullable>` setting, and whether the app uses the
   minimal hosting model (`WebApplication.CreateBuilder` in `Program.cs`) or the older
   `Startup.cs`. Identify the endpoint style (minimal APIs via `MapGet`/`MapPost` vs MVC
   `[ApiController]` controllers — they can coexist), the EF Core provider and `DbContext`(s), the
   auth scheme, and the `appsettings.{Environment}.json` layering.
2. **Wire dependency injection with correct lifetimes.** Register services on
   `builder.Services` and prefer constructor injection. Choose the lifetime deliberately:
   **singleton** (one instance for app lifetime — must be thread-safe, no scoped deps),
   **scoped** (one per request — the lifetime of `DbContext` and most app services), **transient**
   (new each resolve). Diagnose the **captive dependency** anti-pattern: never inject a scoped
   service (e.g. `DbContext`) into a singleton, and never resolve scoped services from the root
   provider — use `IServiceScopeFactory` to create a scope in background/hosted services. Resolve
   `IOptions`/`ILogger<T>` via DI rather than statics.
3. **Order the middleware pipeline correctly.** The pipeline runs in registration order; ordering
   is load-bearing. The canonical order is: exception handling (`UseExceptionHandler`) →
   `UseHttpsRedirection` → `UseRouting` → `UseCors` → `UseAuthentication` → `UseAuthorization` →
   endpoint execution. Authentication must precede authorization; CORS must precede the endpoints it
   guards. Write custom middleware that calls `await next(context)` and short-circuits deliberately.
4. **Choose the endpoint model and bind/validate input.**
   - **Minimal APIs:** map routes with `app.MapGet/MapPost`, bind from route/query/body/services
     via parameter inference (`[FromBody]`/`[FromRoute]`/`[FromServices]` to disambiguate), return
     `Results`/`TypedResults` (`Results.Ok`, `Results.NotFound`, `Results.ValidationProblem`).
   - **MVC controllers:** `[ApiController]` enables automatic model-state validation and 400
     responses, `[FromBody]` inference, and `ProblemDetails`. Use `ControllerBase` action results.
   - **Validation:** apply `DataAnnotations` (`[Required]`/`[Range]`/`[StringLength]`) or a
     validation library; with `[ApiController]` invalid model state auto-returns 400. For minimal
     APIs, validate explicitly or via an endpoint filter and return `Results.ValidationProblem`.
   - **Guard mass-assignment:** bind to a request DTO with only the client-settable fields — never
     bind directly to an EF entity, which lets a client set fields they should not.
5. **Master Entity Framework Core and its query behavior — the top source of correctness and
   performance bugs.**
   - **DbContext:** register `AddDbContext` (scoped); a `DbContext` is not thread-safe and must not
     be shared across concurrent operations. Use `IDbContextFactory` for parallel/background work.
   - **LINQ to entities:** queries translate to SQL and execute on enumeration/`ToListAsync`. Keep
     work server-side; an unintended client evaluation or premature `AsEnumerable` pulls rows into
     memory. Project to DTOs with `Select` to fetch only needed columns.
   - **Avoid N+1:** lazy/explicit per-row loading of navigations causes N+1 queries. Eager-load with
     `.Include()`/`.ThenInclude()`, or project the needed shape with `Select`. Split large includes
     with `AsSplitQuery()` to avoid cartesian explosion.
   - **Tracking:** read-only queries should use `AsNoTracking()` to skip change-tracking overhead;
     tracked queries enable `SaveChangesAsync`. Use async methods (`ToListAsync`,
     `FirstOrDefaultAsync`, `SaveChangesAsync`) throughout and honor `CancellationToken`.
   - **Migrations:** evolve the schema with `dotnet ef migrations add <Name>` and
     `dotnet ef database update`; review the generated migration before applying. Never edit applied
     migrations — add a new one.
6. **Secure with authentication and authorization.** Configure authentication
   (`AddAuthentication().AddJwtBearer(...)`): validate issuer, audience, lifetime, and signing key —
   never disable `ValidateIssuer`/`ValidateAudience`/`ValidateIssuerSigningKey` or accept unsigned
   tokens. Define authorization **policies** (`AddAuthorization(o => o.AddPolicy(...))`) and apply
   with `[Authorize(Policy = "...")]` or `.RequireAuthorization("...")` on minimal-API endpoints; use
   roles/claims/requirements rather than ad-hoc checks. For user accounts use ASP.NET Core Identity.
   Always perform a **resource-owner authorization** check to prevent IDOR — verify the authenticated
   principal owns or may access the specific resource, never trust a client-supplied identifier alone.
7. **Bind configuration with the options pattern.** Read configuration via `IConfiguration` layered
   from `appsettings.json` → `appsettings.{Environment}.json` → environment variables → user secrets
   (precedence increasing). Bind typed settings with
   `services.Configure<TOptions>(config.GetSection(...))` and inject
   `IOptions<T>`/`IOptionsSnapshot<T>`/`IOptionsMonitor<T>` (snapshot for per-request reload, monitor
   for change notifications). Keep secrets out of source — use user secrets in dev and a secrets
   manager/environment in production.
8. **Use filters and endpoint filters for cross-cutting concerns.** In MVC, use action/result/
   exception/authorization filters (`IActionFilter`, `IAsyncActionFilter`, `IExceptionFilter`) for
   cross-cutting logic; register globally, per-controller, or per-action. For minimal APIs, use
   **endpoint filters** (`AddEndpointFilter`) and route-group filters for validation, logging, or
   auth shaping. Centralize error handling with `UseExceptionHandler` + `IExceptionHandler`/
   `ProblemDetails` rather than per-endpoint try/catch.
9. **Stream and go async correctly.** Make handlers `async` end to end, accept and honor
   `CancellationToken` (ASP.NET Core supplies `HttpContext.RequestAborted`), and avoid blocking on
   async. Return `IAsyncEnumerable<T>` from minimal APIs / controllers to stream large result sets
   without buffering the whole set in memory; let EF Core's `AsAsyncEnumerable()` feed it.
10. **Expose health checks.** Register `AddHealthChecks()` with liveness/readiness checks (including
    `AddDbContextCheck` for the database) and map `MapHealthChecks("/healthz")`; separate liveness
    from readiness so orchestrators probe correctly. Don't expose internal detail publicly.
11. **Verify with the .NET CLI** via [[verify-by-running]]: run `dotnet build` (warnings-as-errors if
    configured) and `dotnet test`; for schema changes run `dotnet ef migrations add`/
    `dotnet ef database update` and confirm; run `dotnet format` (or the project's analyzer/format
    gate) to confirm style. Report the exact commands and real results.

## Inputs
- The target framework and SDK, the `.csproj`/`Directory.Build.props` (`<Nullable>`, `LangVersion`),
  `Program.cs`/`Startup.cs`, the relevant endpoints/controllers/services/DTOs, the `DbContext` and
  entity/query code, the auth and authorization configuration, `appsettings.*.json`, and the full
  error text or stack trace / generated SQL for anything being diagnosed.

## Output
- The framework-level cause (DI lifetime/captive dependency, middleware order, model binding/
  validation, EF Core query/N+1/tracking/migration, auth/policy gap, options binding, filter
  placement) and the change as a focused diff.
- For data-layer changes: the resulting SQL/query count and the include/tracking strategy used.
- The build/test/migration/format results via [[verify-by-running]], with the exact commands.

## Notes
- N+1 is the default EF Core performance trap — inspect the generated SQL (logging at the EF Core
  category, or a SQL profiler) rather than guessing; fix with `Include`/projection and consider
  `AsSplitQuery`.
- Captive dependencies (scoped or transient captured by a singleton) and sharing a `DbContext`
  across concurrent tasks are the classic DI/EF lifetime bugs — verify lifetimes match.
- Middleware order is behavior: authentication before authorization, CORS and exception handling in
  the right place. A 401/403 or CORS failure is often an ordering bug.
- General C# concerns — async deadlocks, `ConfigureAwait`, LINQ deferred execution, nullable
  reference types, csproj/NuGet conflicts — belong to [[csharp-idioms]], not here.
- Framework-agnostic HTTP contract design (status codes, error envelopes, pagination semantics,
  versioning) is a separate REST API design concern.
