---
name: solidity-idioms
description: Use when writing, reviewing, or fixing Solidity smart-contract code — contract structure and visibility, storage/memory/calldata layout and gas-aware data design, the checks-effects-interactions pattern, reentrancy and external-call safety, 0.8 checked arithmetic and overflow, access control (Ownable/role-based), events, custom errors and require/revert, proxy and upgradeability patterns (UUPS/Transparent), and ERC standards (20/721/1155). Verifies with the project's toolchain (Foundry forge build/test, Hardhat, solc) plus static analysis (slither/mythril) and gas snapshots. Any agent touching Solidity (developer, auditor, gas optimizer, tester, web3 team) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [solidity, smart-contracts, evm, foundry, security]
version: 1.0.0
license: MIT
status: stable
---

# Solidity Idioms

The substantive Solidity capability: write clear, gas-aware, exploit-resistant smart contracts
and verify them with the project's toolchain and static analysis.

## When to use this skill
When authoring, reviewing, gas-optimizing, testing, or debugging Solidity and any of these is
involved: contract structure and visibility, a storage/memory/calldata or gas-layout question,
an external-call/reentrancy concern, arithmetic and overflow behavior, access control, events,
error handling (`require`/`revert`/custom errors), proxy/upgradeability, or an ERC-standard
implementation. Not needed for trivial edits with no on-chain state, value-transfer,
external-call, or gas dimension.

## Instructions
1. **Establish the contract structure and visibility.** Pin the `pragma`/compiler version
   (prefer 0.8.x), order the layout idiomatically (state vars, events, errors, modifiers,
   constructor, external/public then internal/private functions), and set the tightest
   visibility on every function and state variable. Mark functions `view`/`pure` where they
   read or compute without writing state.
2. **Reason about data location and gas-aware layout.** Distinguish `storage` (persistent, SLOAD/
   SSTORE — expensive), `memory` (transient, function-scoped), and `calldata` (read-only, cheapest
   for external inputs — prefer it for external function array/struct/bytes params). Pack struct
   and storage-slot fields to minimize slots; cache repeated `storage` reads into a `memory` local;
   avoid unbounded loops over storage.
3. **Apply checks-effects-interactions and external-call safety.** Validate inputs and authority
   (checks) first, update all contract state (effects) next, and make external calls/value
   transfers (interactions) last. Treat every external call as adversarial: guard reentrancy with
   the C-E-I ordering and/or a `nonReentrant` guard, check `call` return values, prefer pull-over-
   push for payouts, and never assume `transfer`/`send` gas stipend semantics — use `call` with
   explicit handling.
4. **Get arithmetic and error handling right.** Rely on 0.8 checked arithmetic for overflow/
   underflow; justify any `unchecked` block with why it cannot overflow. Use `require`/custom
   `error` types for input/authority validation and revert with informative reasons; prefer
   custom errors over revert strings for gas. Reserve `assert` for invariants that should never
   fail. Emit `event`s for every state change that off-chain consumers index.
5. **Enforce access control.** Use a clear ownership/role model (`Ownable`, `AccessControl`/role-
   based) with explicit modifiers; protect privileged functions (mint, pause, upgrade, withdraw,
   parameter setters) and initializers. For upgradeable contracts, ensure `initialize` is guarded
   against re-initialization and the constructor is disabled (`_disableInitializers`).
6. **Handle proxies and upgradeability deliberately.** For UUPS/Transparent proxies, preserve
   storage layout across upgrades (append-only; never reorder/insert/remove slots), use storage
   gaps or namespaced storage, guard `_authorizeUpgrade`, and use `initializer`/`reinitializer`
   instead of constructors. Flag any layout change that would corrupt existing state.
7. **Implement ERC standards faithfully.** For ERC-20/721/1155, follow the exact interface,
   event, and return-value semantics (e.g. ERC-20 `transfer` returning bool, approval race,
   ERC-721 `safeTransferFrom` receiver hook, ERC-1155 batch semantics); prefer audited reference
   implementations (OpenZeppelin) over hand-rolling.
8. **Verify.** Detect the toolchain and run it: Foundry — `forge build` then `forge test`
   (with fuzzing/invariants where present) and `forge snapshot` for gas; Hardhat — `npx hardhat
   compile` and `npx hardhat test`; or `solc` directly. Run static analysis — `slither .` and/or
   `myth analyze` — and report findings. Report the exact commands and results.

## Inputs
- The Solidity source, the toolchain config (`foundry.toml` / `hardhat.config.*`), the compiler
  version, the dependency set (OpenZeppelin, Solmate), and the full error/trace or static-analysis
  output for anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious
  data-location choice, `unchecked` block, access guard, or storage-layout decision.
- The build/test/static-analysis commands run and their results; any remaining reentrancy window,
  unchecked external call, layout risk, or unbounded loop flagged with why.

## Notes
- Security and correctness over cleverness — value at stake makes a single bug catastrophic and
  on-chain code is immutable once deployed.
- Never claim a contract is reentrancy-safe or upgrade-safe without reasoning through the specific
  call path or storage layout.
- Apply within the project's conventions — match its toolchain, dependency library, and style;
  do not introduce a second framework where the existing one suffices.
