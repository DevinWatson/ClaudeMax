---
name: spring-boot-framework
description: Use when working in Spring Boot (Java) — dependency injection and the IoC container, auto-configuration and starters, stereotype annotations (@Component/@Service/@Repository/@RestController), Spring MVC and WebFlux controllers, Spring Data JPA (repositories, @Query methods, N+1 avoidance with fetch joins/@EntityGraph), Bean Validation, Spring Security (auth and method security), externalized configuration and profiles, Actuator, transactions (@Transactional), and testing (@SpringBootTest, MockMvc/WebTestClient, @DataJpaTest, Testcontainers). Verifies with the project's build (mvn verify / gradlew test). TRIGGER on Spring bean wiring or context-startup failures, Spring Data JPA repository/query/N+1 issues, @Transactional rollback problems, Spring Security config/authorization gaps, Actuator exposure, or @SpringBootTest/MockMvc setup. NOT for general Java language concerns (generics, the memory model, build/dependency conflicts — that is java-idioms) or framework-agnostic HTTP contract design.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [spring-boot, spring, jpa, spring-security, java, web]
version: 1.0.0
license: MIT
status: stable
maintainer: devinwatson@gmail.com
---

# Spring Boot Framework

The substantive Spring Boot capability: get the *framework* concerns right — the IoC container
and dependency injection, auto-configuration and starters, the stereotype layering, the web layer
(MVC/WebFlux), Spring Data JPA and its query behavior, Bean Validation, Spring Security,
externalized configuration and profiles, Actuator, transactions, and testing — and verify with the
project's build and quality gates. This is distinct from general Java language concerns (generics,
the Java Memory Model, Maven/Gradle dependency conflicts), which are the domain of [[java-idioms]].

## When to use this skill
When the problem is framework-level Spring Boot behavior: a bean-wiring or context-startup
failure, an auto-configuration or starter question, a stereotype/component-scan issue, a Spring
MVC/WebFlux controller, a Spring Data JPA repository/query/N+1 problem, a `@Transactional`
propagation or rollback question, a Spring Security authentication/authorization concern,
externalized config/profile resolution, an Actuator endpoint, or a `@SpringBootTest`/MockMvc/
Testcontainers test setup. Not for pure Java idioms (use [[java-idioms]]) or framework-agnostic
HTTP contract design (status codes, error envelopes, versioning). Pairs with
[[match-project-conventions]] and [[verify-by-running]].

## Instructions
1. **Establish the project shape first.** Find the Spring Boot version and the build (Maven
   `pom.xml` or Gradle `build.gradle[.kts]`), the JDK version, the starters in use
   (`spring-boot-starter-web`/`-webflux`/`-data-jpa`/`-security`/`-actuator`), and whether the web
   stack is servlet (MVC) or reactive (WebFlux) — they do not mix. Locate the
   `@SpringBootApplication` class and its base package (component-scan root), the active profiles,
   and the `application.{properties,yml}` per profile.
2. **Reason about the IoC container and dependency injection.** Beans are created and wired by the
   container; prefer **constructor injection** (final fields, testable, fails fast on missing
   deps) over field injection. Understand component scanning of stereotypes (`@Component`,
   `@Service`, `@Repository`, `@Controller`/`@RestController`) and `@Configuration` + `@Bean`
   factory methods. Resolve ambiguity with `@Qualifier`/`@Primary`; scope deliberately (singleton
   default vs `@Scope("prototype")`/request). Diagnose `NoSuchBeanDefinitionException`/
   `NoUniqueBeanDefinitionException`/circular-reference failures from the actual startup log.
3. **Use auto-configuration and starters intentionally.** Starters pull curated dependencies;
   auto-configuration wires beans conditionally (`@ConditionalOnClass`/`OnMissingBean`/
   `OnProperty`). Override by defining your own bean (which backs off the auto-config) or via
   properties — not by fighting the framework. Use `--debug` / the Actuator conditions report to
   see what auto-configured and why.
4. **Get the web layer right.**
   - **Spring MVC (servlet):** `@RestController` with `@GetMapping`/`@PostMapping` etc.,
     `@PathVariable`/`@RequestParam`/`@RequestBody`, `ResponseEntity` for explicit status, and a
     `@RestControllerAdvice` + `@ExceptionHandler` for a consistent error envelope. Validate
     request bodies with `@Valid` and Bean Validation constraints (`@NotNull`, `@Size`, `@Email`,
     custom validators); handle `MethodArgumentNotValidException`.
   - **WebFlux (reactive):** controllers return `Mono`/`Flux`; never block the event loop (no
     blocking JDBC/`.block()` on the reactive path). Choose one stack per service.
5. **Master Spring Data JPA and its query behavior — the top source of correctness and
   performance bugs.**
   - **Repositories:** extend `JpaRepository`/`CrudRepository`; use derived query methods, `@Query`
     (JPQL or `nativeQuery`), and `@Modifying` for writes. Page large reads with `Pageable`.
   - **Avoid N+1:** lazy associations fetched per-row cause N+1 selects. Fix with a **fetch join**
     (`JOIN FETCH` in `@Query`) or `@EntityGraph` on the repository method; keep `FetchType.LAZY`
     as the default and fetch eagerly only where needed. Be wary of `OpenSessionInView` masking the
     problem.
   - **Transactions & the persistence context:** entities are managed only inside a transaction;
     `LazyInitializationException` means you touched a lazy field outside one. Map relationships and
     cascades deliberately; watch `equals`/`hashCode` on entities.
6. **Manage transactions explicitly.** Put `@Transactional` on service methods (not controllers);
   it works via proxies, so **self-invocation does not start a transaction** and it applies only to
   `public` methods on Spring-managed beans. Know propagation (`REQUIRED` default, `REQUIRES_NEW`,
   `NESTED`), `readOnly = true` for queries, and that rollback is triggered by unchecked exceptions
   by default — set `rollbackFor` for checked ones. Keep transaction boundaries narrow.
7. **Secure the application with Spring Security.** Define a `SecurityFilterChain` bean (modern,
   non-deprecated config): set authentication (form/JWT/OAuth2 resource server), authorization
   rules (`authorizeHttpRequests`), CSRF posture (keep it on for browser/session flows; disable
   only for stateless token APIs and know why), CORS, and security headers. Use method security
   (`@EnableMethodSecurity`, `@PreAuthorize`/`@PostAuthorize`) for fine-grained checks. Always
   authorize the resource owner to prevent IDOR; never trust client-supplied identity. Be careful
   with SpEL in `@PreAuthorize` and never expose actuator/management endpoints unauthenticated in
   production.
8. **Externalize configuration and use profiles.** Bind config with `@ConfigurationProperties`
   (typed, validated) over scattered `@Value`. Layer `application-{profile}.yml` and activate via
   `spring.profiles.active`; keep secrets out of source (env vars / a secrets manager). Understand
   property precedence (command line > env > profile-specific > application.yml).
9. **Operate with Actuator.** Expose only the endpoints you need
   (`management.endpoints.web.exposure.include`); secure them; keep `health`/`info`/`metrics`/
   `prometheus` for ops and never expose `env`/`heapdump`/`loggers` publicly. Pair with Micrometer
   for metrics (defer instrumentation strategy to [[observability-instrumentation]]).
10. **Test at the right level.** `@SpringBootTest` for full-context integration; slice tests for
    speed — `@WebMvcTest` + `MockMvc` (or `WebTestClient` for WebFlux) for the web layer,
    `@DataJpaTest` for repositories. Use Testcontainers for a real database instead of H2 when
    fidelity matters; use `@MockBean` to replace collaborators; assert N+1 is gone (e.g. via SQL
    logging / Hibernate statistics).
11. **Verify with the project's build and quality gates** via [[verify-by-running]]: run
    `mvn -q verify` or `./gradlew test` (or the specific module/task), plus the project's
    checkstyle/spotbugs gates if configured, in the project's environment. Report the exact commands
    and real results.

## Inputs
- The Spring Boot version, the build file (`pom.xml`/`build.gradle[.kts]`) with JDK and starters,
  the relevant `@Configuration`/controllers/services/repositories/entities/security config and
  `application.{properties,yml}`, and the full error text or stack trace / startup log / slow-query
  output for anything being diagnosed.

## Output
- The framework-level cause (bean wiring, auto-config back-off, JPA fetch/N+1, transaction
  boundary, security rule, profile/property resolution, etc.) and the change as a focused diff.
- For data-layer changes: the resulting SQL/query count and the fetch strategy used.
- The build/test and checkstyle/spotbugs results via [[verify-by-running]], with the exact commands.

## Notes
- N+1 is the default JPA performance trap — inspect the actual SQL (`spring.jpa.show-sql`,
  Hibernate statistics, or `datasource-proxy`) rather than guessing.
- `@Transactional` and `@Async` work via proxies: self-invocation, `private`/`final` methods, and
  internal calls silently bypass them. Verify the call path crosses a proxy boundary.
- General Java concerns — generics, the memory model, modern-language features, Maven/Gradle
  dependency conflicts — belong to [[java-idioms]], not here.
- Framework-agnostic HTTP contract design (status codes, error envelopes, pagination semantics,
  versioning) is a separate REST API design concern.
