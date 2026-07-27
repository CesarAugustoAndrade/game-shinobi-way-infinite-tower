/**
 * Host-scoped item-tile tooltips open above the card by default.
 * When the host sits near the top of the viewport the popover would clip —
 * flip it below the card for that open.
 */
export function alignItemTileTooltip(host: HTMLElement): void {
  const tip = host.querySelector<HTMLElement>(':scope > .item-tile__tooltip');
  if (!tip) return;

  const hostTop = host.getBoundingClientRect().top;
  // offsetHeight works while opacity:0 / visibility:hidden (still laid out)
  const tipH =
    tip.offsetHeight > 0
      ? tip.offsetHeight
      : Math.min(window.innerHeight * 0.5, 22 * 16);
  const needsBelow = hostTop < tipH + 12;
  host.classList.toggle('item-tile--tooltip-below', needsBelow);
}
