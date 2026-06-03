---
name: nestjs-framework
description: Use when working in NestJS (Node.js, TypeScript) — the module system and the DI container (providers, custom providers, injection scopes, dynamic modules), controllers and the decorator/routing model, services, the request lifecycle (middleware → guards → interceptors → pipes → handler → filters), validation pipes (class-validator or zod), DTOs, the module graph, microservices and GraphQL options, TypeORM/Prisma/Mongoose integration, the ConfigModule, and testing with @nestjs/testing + supertest. Verifies with nest build/tsc, jest unit + e2e, and eslint. TRIGGER on NestJS DI/provider-resolution errors, module import/export wiring, enhancer (guard/interceptor/pipe/filter) ordering, ValidationPipe/DTO gaps, dynamic-module config, microservice/GraphQL wiring, or ORM integration. NOT for general TypeScript type-system concerns (typescript-type-system), NOT for framework-agnostic HTTP contract design, and NOT for Express — Express is a minimal/unopinionated server, NestJS is an opinionated DI/decorator framework.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [nestjs, nodejs, typescript, dependency-injection, decorators, api]
version: 1.0.0
license: MIT
status: stable
maintainer: devinwatson@gmail.com
---

# NestJS Framework

The substantive NestJS capability: get the *framework* concerns right — the module system and
the DI container (providers, custom providers, scopes, dynamic modules), controllers and the
decorator/routing model, services/providers, the enhancer pipeline (middleware, guards,
interceptors, pipes, exception filters) and the order in which it runs, DTO validation with
`ValidationPipe`, the module graph, microservices and GraphQL options, ORM integration
(TypeORM/Prisma/Mongoose), the ConfigModule, and testing with `@nestjs/testing` and supertest —
and verify with the project's runner and quality gates. This is distinct from general TypeScript
language concerns (generics, inference, `tsconfig`, module resolution), which are the domain of
[[typescript-type-system]], and from framework-agnostic HTTP contract design. It is also distinct
from Express: Express is a minimal, unopinionated Node API server you assemble by hand, whereas
NestJS is an opinionated framework built around dependency injection and decorators with a fixed
request lifecycle.

## When to use this skill

When the problem is framework-level NestJS behavior: a provider that won't resolve (`Nest can't
resolve dependencies of …`), a module that doesn't export/import what a consumer needs, a guard or
interceptor or pipe or filter running in the wrong place (or not at all), a `ValidationPipe`/DTO
that isn't rejecting bad input, a dynamic module (`forRoot`/`forRootAsync`/`registerAsync`) wiring
question, a microservice transport or GraphQL resolver wiring issue, an injection-scope
(`REQUEST`-scoped vs singleton) surprise, or a TypeORM/Prisma/Mongoose module integration. Not for
pure TypeScript type-system issues (use [[typescript-type-system]]), framework-agnostic REST
contract design (status-code discipline, versioning, pagination semantics as a discipline), or
Express. Pairs with [[match-project-conventions]] and [[verify-by-running]].

## Instructions

1. **Establish the project shape first.** Read `package.json` for the NestJS major version
   (`@nestjs/core`, `@nestjs/common`), the platform adapter (`@nestjs/platform-express` — the
   default — vs `@nestjs/platform-fastify`), the package manager (npm/pnpm/yarn), the `nest-cli.json`
   and build setup (`nest build` / `tsc` / SWC), `tsconfig.json`, and which feature libraries are in
   use (`@nestjs/typeorm`/`@nestjs/mongoose`/Prisma, `@nestjs/microservices`, `@nestjs/graphql`,
   `@nestjs/config`, `class-validator`/`class-transformer`). Find the root `AppModule`, the bootstrap
   in `main.ts` (`NestFactory.create`, global pipes/guards/interceptors/filters, CORS), and the
   module graph.
2. **Understand the module system and the DI container.** Every provider belongs to a module; a
   provider is only injectable in modules that import the module that **exports** it. `@Module({
   imports, controllers, providers, exports })` is the contract: a `provider` is registered in that
   module's injector, but consumers in other modules need it in `exports` of the providing module and
   that module in their `imports`. Diagnose `Nest can't resolve dependencies of X (?)` as a missing
   provider, a missing import/export, or a circular dependency (break it with `forwardRef()` or by
   refactoring). Make shared providers available app-wide via a `@Global()` module sparingly.
3. **Use providers and injection deliberately.** Mark injectables with `@Injectable()`; inject by
   type via the constructor, or by token with `@Inject(TOKEN)`. Use custom providers when you need a
   non-class dependency: `useClass` (swap implementations), `useValue` (constants/mocks),
   `useFactory` (computed, with `inject:` for its own deps), and `useExisting` (alias). Prefer
   interface + injection-token over concrete classes at boundaries you want to swap or mock. Know the
   **injection scopes**: `DEFAULT` (singleton, the norm), `REQUEST` (new instance per request — needed
   for per-request state but bubbles scope up the chain and costs performance), and `TRANSIENT`.
4. **Write controllers with the decorator/routing model.** `@Controller('users')` sets the route
   prefix; `@Get(':id')`/`@Post()`/etc. define handlers; bind inputs with `@Param`, `@Query`,
   `@Body`, `@Headers`, `@Req`. Keep controllers thin — translate HTTP ↔ domain and delegate to
   services. Set status with `@HttpCode()`, headers with `@Header()`, and prefer returning plain
   objects/DTOs (Nest serializes) over touching the raw response. Use `@UseGuards`/`@UseInterceptors`/
   `@UsePipes`/`@UseFilters` at the controller or handler level for scoped enhancers.
5. **Know the request lifecycle and enhancer order.** A request flows: **middleware → guards →
   interceptors (pre) → pipes → route handler → interceptors (post) → exception filters** (filters
   catch thrown exceptions anywhere downstream). Enhancers can be bound globally (in `main.ts` via
   `app.useGlobal*`, or as `APP_GUARD`/`APP_PIPE`/`APP_INTERCEPTOR`/`APP_FILTER` providers so they
   can inject dependencies), per-controller, or per-handler. A guard that "doesn't run" or a pipe
   that "doesn't validate" is almost always a binding-scope or ordering problem.
6. **Validate input with pipes and DTOs.** Define DTO classes and decorate fields with
   `class-validator` (`@IsString`, `@IsEmail`, `@Min`, `@IsOptional`, nested `@ValidateNested` +
   `@Type`). Enable a global `ValidationPipe` with `whitelist: true` (strip unknown props),
   `forbidNonWhitelisted: true` (reject them), and `transform: true` (instantiate the DTO and coerce
   types). Without `class-transformer`/`transform`, a `@Body()` is a plain object and validators may
   not fire as expected. For projects using zod, wrap a zod schema in a custom `PipeTransform`.
   Never trust client input and never persist a raw body wholesale (mass-assignment) — validate and
   allow-list.
7. **Implement guards, interceptors, and filters.** **Guards** (`CanActivate`) decide
   authn/authz — read the request, verify the JWT (signature/`exp`/issuer/audience, never
   decode-without-verify), and use a `RolesGuard` + `@Roles()` metadata via `Reflector` for
   authorization; enforce ownership server-side to prevent IDOR. **Interceptors**
   (`NestInterceptor`) wrap the handler (logging, timing, response shaping, caching) around an
   RxJS stream. **Exception filters** (`ExceptionFilter`) translate thrown errors into a consistent
   response envelope — map `HttpException` subclasses to their status and collapse unexpected errors
   to a generic 500 without leaking stack traces or internals.
8. **Compose the module graph and dynamic modules.** Split the app into feature modules; share
   cross-cutting providers via exported providers or a `@Global()` core module. For configurable
   modules (DB, config, third-party clients), use the **dynamic module** pattern: a static
   `forRoot(options)` / `forRootAsync({ useFactory, inject })` (or `register`/`registerAsync`)
   returning `{ module, providers, exports }`. Use `forFeature` for per-feature registration (e.g.
   TypeORM repositories). Resolve circular module deps with `forwardRef()`.
9. **Wire microservices, transport, and GraphQL when present.** For `@nestjs/microservices`, create
   the app with `createMicroservice` (or a hybrid app) choosing the transport (TCP/Redis/NATS/Kafka/
   gRPC/RabbitMQ), and use `@MessagePattern` (request-response) vs `@EventPattern` (fire-and-forget)
   correctly. For `@nestjs/graphql`, pick code-first (`@ObjectType`/`@Resolver`/`@Query`/`@Mutation`
   with auto-generated schema) or schema-first; wire resolvers and field resolvers, and use
   DataLoader to avoid N+1.
10. **Integrate the data layer.** With `@nestjs/typeorm`: `TypeOrmModule.forRoot(Async)` for the
    connection and `forFeature([Entity])` per module, injecting repositories with
    `@InjectRepository`. With **Prisma**: wrap `PrismaClient` in an injectable `PrismaService`
    (connect/disconnect on lifecycle hooks) exported from a module. With `@nestjs/mongoose`:
    `MongooseModule.forRoot(Async)` + `forFeature([{ name, schema }])` and `@InjectModel`. Keep data
    access in services/repositories, not controllers, and use transactions where invariants span
    writes.
11. **Configure with the ConfigModule.** Use `@nestjs/config` `ConfigModule.forRoot({ isGlobal,
    validationSchema, load })` to load and **validate** environment config at startup (fail fast on
    missing/invalid vars), and inject `ConfigService` (typed via a config namespace) rather than
    reading `process.env` directly throughout the code.
12. **Type the layer in TypeScript.** Type DTOs, provider interfaces, injection tokens, and
    service signatures soundly; avoid `any` at the controller/DTO boundary. Use generics for shared
    interceptors/repositories where they earn it. Defer deeper type-system questions to
    [[typescript-type-system]].
13. **Test with @nestjs/testing and supertest.** Unit-test providers/services by building a
    `Test.createTestingModule({ providers })` and overriding dependencies with
    `.overrideProvider(X).useValue(mock)`. For controller/e2e tests, build the module,
    `app = moduleRef.createNestApplication()`, apply the same global pipes as production,
    `await app.init()`, and drive it with **supertest** (`request(app.getHttpServer())`) asserting
    status/body/headers; tear down with `app.close()`.
14. **Verify with the project's runner and quality gates** via [[verify-by-running]]: run the build/
    typecheck (`nest build` or `tsc --noEmit` or the project's `build`/`typecheck` script), the unit
    tests (`jest`) and the e2e tests (`jest --config ./test/jest-e2e.json` driving the app with
    supertest), and `eslint`, in the project's environment (npm/pnpm/yarn). Report the exact commands
    and real results.

## Inputs

- The NestJS major version and project config (`package.json` with scripts and the feature
  libraries, `nest-cli.json`, `tsconfig.json`, configured eslint and jest), the platform adapter,
  `main.ts` bootstrap and global enhancers, the module graph (`AppModule` and feature modules with
  their `imports`/`providers`/`exports`), the relevant controllers/providers/DTOs/guards/
  interceptors/pipes/filters, the data-layer module wiring, and the full error text or stack trace /
  failing request-response for anything being diagnosed.

## Output

- The framework-level cause (DI/provider resolution, module import/export wiring, enhancer
  ordering/binding scope, `ValidationPipe`/DTO gap, dynamic-module config, microservice/GraphQL
  wiring, ORM integration, injection scope) and the change as a focused diff, with a one-line
  rationale per non-obvious choice.
- The build/typecheck/unit/e2e/lint results via [[verify-by-running]], with the exact commands.

## Notes

- **`Nest can't resolve dependencies of X (?)` is the signature DI error.** The `?` marks the
  unresolved position: the provider is missing from the module's `providers`, or it lives in another
  module that doesn't `export` it (and isn't imported here), or there is a circular dependency
  (use `forwardRef()` or refactor).
- **Enhancer binding scope is the contract.** A guard/pipe/interceptor/filter only applies where it
  is bound — global (`useGlobal*` or `APP_*` provider), controller, or handler. A `ValidationPipe`
  that doesn't reject input is usually unbound globally or missing `transform`/`whitelist`.
- **`REQUEST`-scoped providers bubble.** Making one provider request-scoped forces everything that
  depends on it to be request-scoped too, with a per-request instantiation cost — use it
  deliberately.
- **`APP_*` providers vs `useGlobal*`.** Bind global enhancers as `APP_GUARD`/`APP_PIPE`/
  `APP_INTERCEPTOR`/`APP_FILTER` providers when they need to inject dependencies; `app.useGlobal*`
  in `main.ts` cannot inject.
- **Never leak internals**: collapse unexpected errors to a generic 500 in an exception filter and
  keep stack traces server-side; validate and allow-list DTOs to avoid mass-assignment.
- General TypeScript concerns — generics, inference, `tsconfig`/module resolution — belong to
  [[typescript-type-system]], not here. Framework-agnostic HTTP contract design (status-code
  discipline, versioning, pagination semantics) is a separate REST API design concern. Express is a
  separate, minimal/unopinionated server — not this skill.
