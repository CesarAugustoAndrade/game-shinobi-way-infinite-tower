# RULES — Lecciones del Loop (memoria)

> Ledger de aprendizaje. **El loop solo añade una regla cuando un error se REPITE**
> (no preventivamente). Cada regla debe, si se puede, convertirse en un check
> determinista (test / lint / aserción de simulación). El humano poda y reescribe.
>
> Formato de cada regla:
> `- AAAA-MM-DD — <qué pasó>. RULE: <qué hacer/evitar>. (candidate: <check determinista>)`
>
> El maker lee este archivo antes de aplicar. Los reviewers lo leen como checklist de trampas.

## ARQUITECTURA

_(sin reglas aún)_

## SISTEMA

- 2026-06-29 — Módulos de lógica de combate PUROS nuevos (combatCards en F1, DeckSystem/PostureSystem en F2) capan la lente SISTEMA <85 por "edge cases sin test", DOS veces. RULE: al planear un topic que añade lógica de combate pura load-bearing, **proponer proactivamente su test unitario al humano** (CLAUDE.md prohíbe tests sin pedir; el usuario los autoriza para lógica de combate clave — ya dijo sí a combatCards). Incluir el test en el mismo intento del maker, no como gap posterior. (candidate: que el maker, al crear un sistema puro en `game/systems`, incluya su `__tests__/<sistema>.test.ts` salvo veto explícito.)

## PRESENTACION

_(sin reglas aún)_

## BALANCE

_(sin reglas aún)_
