---
name: game-balance
description: Use when tuning or analyzing game systems for balance — mapping economy faucets/sinks and currency inflation, expressing cost/power/XP as explicit curves (linear/polynomial/exponential), reasoning about player incentives and dominant strategies via efficiency ratios, setting difficulty and progression pacing, and modeling stochastic systems (drops, crit, gacha) with Monte-Carlo before shipping numbers. Produces tuned numbers/formulas and the model behind them. TRIGGER on inflation, difficulty curves, progression pacing, shop pricing, or dominant-build problems. Any agent tuning game systems (balance designer, economy designer, systems-design reviewer) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: domain
tags: [gamedev, balance, economy, progression]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Game Balance

The substantive capability for tuning game systems so they feel fair, paced, and resistant
to degenerate strategies — and explaining the model behind every number.

## When to use this skill
When the goal is to fix or analyze a game system's balance: runaway economy inflation, a
difficulty curve, progression/level pacing, cost/power outliers, shop prices, or a dominant
build. Identify the **system** (economy, combat, progression, crafting, matchmaking,
gacha/monetization) and the **goal**, and state target metrics if given (session length,
retention, time-to-level, kill-time). Read existing balance data first — config tables,
spreadsheets, formula files, item/enemy/level data, drop tables — and match the project's
units and conventions; don't reinvent the schema.

## Instructions
1. **Map the system as flows and curves.**
   - **Economy:** enumerate **faucets** (sources: quest rewards, drops, dailies, selling)
     and **sinks** (gold removal: repairs, crafting, upgrade costs, consumables, taxes). Net
     faucet minus sink per play-hour drives inflation/deflation; a healthy economy keeps a
     closed loop with sinks scaling alongside faucets. Compute earn rate vs spend rate per
     progression stage.
   - **Curves:** express cost/power/XP as explicit formulas — linear (`base + k·n`),
     polynomial, or exponential (`base · r^n`). XP-to-level is usually super-linear; rewards
     should track it so time-per-level stays in band. Plot power vs cost to expose outliers.
2. **Reason about incentives and dominant strategies.** For any choice the player makes,
   compute the efficiency ratio (damage per mana, gold per hour, power per cost). If one
   option dominates across the relevant range, it becomes the only choice — flatten it via
   cost, diminishing returns, opportunity cost, or soft caps. Look for exploit loops
   (buy-low/sell-high arbitrage, infinite farms, reward-per-time outliers) and close them
   with sinks, cooldowns, or scaling costs.
3. **Set difficulty/progression pacing.** Align enemy stat growth with player power growth so
   time-to-kill and survivability stay in band across the curve. Introduce mechanics on a
   pacing schedule; avoid difficulty cliffs and dead zones. Define intended player power at
   each checkpoint and tune around it.
4. **Model before shipping numbers.** Tune in a spreadsheet/script: lay out the formula,
   parameters, and resulting curves; sweep parameters for sensitivity. For stochastic systems
   (drop tables, crit, gacha) run a **Monte-Carlo** simulation (e.g. 10k players over N
   hours) to get distributions — expected value, variance, worst-case grind, pity-timer
   behavior — not just the mean. Report the distribution, not a single number.
5. **Propose minimal, reversible tuning levers.** Prefer adjusting a few parameters (a rate,
   a coefficient, a soft cap) over redesigning systems. State each lever, its current →
   proposed value, and the predicted effect on the metric.

## Inputs
- The system and goal, target metrics if any, and existing balance data (config/tables/
  formulas/drop tables) in the project's own units.

## Output
- The diagnosis: which flow/curve/incentive is off and the evidence (numbers, ratios, sim
  output).
- The proposed change as concrete values/formulas (and the edited config/table when asked),
  with current → proposed and the rationale.
- Predicted effect on target metrics, plus the simulation/spreadsheet model or its summary.
- Risks/side effects and what to playtest or measure to confirm.

## Notes
- Numbers must come from a model, not vibes — show the formula or simulation behind any value.
- Always check the dominant strategy your change creates; don't fix one exploit by opening
  another. Note second-order effects on other systems.
- For monetization/gacha tuning, stay on the design/math side (rates, pity, expected cost)
  and flag that legal disclosure and ethical/regulatory review (loot-box rules vary by
  jurisdiction) are out of scope.
- Balance is empirical: frame predictions as hypotheses to validate with playtesting/telemetry.
