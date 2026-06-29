# Rúbrica — SISTEMA (mecánica / jugabilidad)

Mide si la **mecánica funciona, es alcanzable en el juego real, y no rompe lo existente**.
Semi-determinista: se apoya en tests pero también en lectura de la mecánica vs el topic.

## Gates deterministas

```bash
npm test               # ninguna de las 9 suites debe regresionar
```

Idealmente la mecánica nueva/cambiada tiene **cobertura de test** en
`src/game/systems/__tests__/`. Si el cambio toca un sistema con suite y la rompe → **Score ≤ 49**.

## Checklist

- [ ] **Correctitud**: la mecánica hace lo que dice la `description` del topic.
- [ ] **Reachability**: está cableada y es alcanzable en gameplay real (App.tsx / systems / hooks),
      no es código muerto que nadie invoca.
- [ ] **Edge cases**: estados límite cubiertos (HP 0, recurso insuficiente, stun, stack de efectos)
      — idealmente por un test o por una corrida de simulación.
- [ ] **Consistencia de reglas**: respeta ciclo elemental, tipos de daño, e interacción
      predecible de status effects (DoT, shield, reflect, invuln, curse mark, etc.).
- [ ] **Sin regresión**: las otras suites siguen verdes.

## Bandas

| Score | Criterio |
|-------|----------|
| **85–100** | Mecánica correcta vs descripción, **alcanzable** en gameplay, edge cases cubiertos por test o sim, cero regresiones. |
| **70–84** | Funciona, pero edge cases sin test, o cableado parcial (funciona en un camino, falta otro). |
| **50–69** | **Gap de lógica** o la mecánica **no es alcanzable** (dead code), o interacción de efectos inconsistente. |
| **< 50** | Mecánica incorrecta, o **regresiona** una suite existente. **Auto-fail.** |

## Evidence a citar
- Resultado de `npm test` (con foco en la suite del sistema tocado).
- El punto de cableado que prueba reachability (`archivo:línea` donde se invoca).
- Qué edge cases están/ no están cubiertos.
