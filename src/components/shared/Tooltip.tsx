import React, { useState, useRef, useLayoutEffect, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { FeatureFlags } from '../../config/featureFlags';
import './shared.css';

type TooltipPosition = 'bottom' | 'right' | 'top' | 'left';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  position?: TooltipPosition;
  /** Opt-in press trigger for non-actionable info affordances on touch devices. */
  openOnClick?: boolean;
  /** Allow keyboard/touch users to pin and scroll dense reference content. */
  interactive?: boolean;
}

const VIEWPORT_PAD = 8;

interface HostRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface AnchorPoint {
  top: number;
  left: number;
  position: TooltipPosition;
}

interface Placement {
  top: number;
  left: number;
  clamped: boolean;
  /** True once top/left contain final viewport coordinates, including side offsets. */
  measured: boolean;
  /** Final side after flip — drives CSS class / arrow */
  position: TooltipPosition;
}

/**
 * Portal tooltip — unified abyss chrome (shared.css `.tooltip`).
 * Anchor by intent; layout-clamp keeps trade-offs on-screen (VISION-8 A6).
 */
const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  className = 'w-full',
  position: preferredPosition = 'bottom',
  openOnClick = false,
  interactive = false,
}) => {
  const tooltipId = useId();
  const instructionId = `${tooltipId}-instruction`;
  const [isVisible, setIsVisible] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [hostRect, setHostRect] = useState<HostRect | null>(null);
  const [anchor, setAnchor] = useState<AnchorPoint | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const restoreTriggerFocus = useCallback(() => {
    const focusTarget = hostRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), '
        + 'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? hostRef.current;
    focusTarget?.focus({ preventScroll: true });
  }, []);

  const resolveAnchor = useCallback((rect: HostRect, pos: TooltipPosition): AnchorPoint => {
    if (pos === 'right') {
      return { top: rect.top + rect.height / 2, left: rect.right + 8, position: pos };
    }
    if (pos === 'left') {
      return { top: rect.top + rect.height / 2, left: rect.left - 8, position: pos };
    }
    if (pos === 'top') {
      return { top: rect.top - 8, left: rect.left + rect.width / 2, position: pos };
    }
    return { top: rect.bottom + 8, left: rect.left + rect.width / 2, position: pos };
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current === null) return;
    window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  }, []);

  const measureHost = useCallback(() => {
    const target = hostRef.current;
    if (!target) return;
    const r = target.getBoundingClientRect();
    const rect: HostRect = {
      top: r.top,
      left: r.left,
      right: r.right,
      bottom: r.bottom,
      width: r.width,
      height: r.height,
    };
    const next = resolveAnchor(rect, preferredPosition);
    setHostRect(rect);
    setAnchor(next);
    // Pre-clamp estimate so first paint is roughly correct; layout effect refines
    setPlacement({
      top: next.top,
      left: next.left,
      clamped: false,
      measured: false,
      position: next.position,
    });
  }, [preferredPosition, resolveAnchor]);

  const show = useCallback(
    () => {
      if (!FeatureFlags.ENABLE_TOOLTIPS) return;
      clearHideTimer();
      measureHost();
      setIsVisible(true);
    },
    [clearHideTimer, measureHost]
  );

  const hide = useCallback(() => {
    clearHideTimer();
    setIsPinned(false);
    setIsVisible(false);
    setHostRect(null);
    setAnchor(null);
    setPlacement(null);
  }, [clearHideTimer]);

  const scheduleHide = useCallback(() => {
    if (isPinned) return;
    clearHideTimer();
    // Enough time to cross the 8px portal gap without punishing imprecise movement.
    hideTimerRef.current = window.setTimeout(hide, 280);
  }, [clearHideTimer, hide, isPinned]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  useEffect(() => {
    if (!isVisible) return;
    const reposition = () => measureHost();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [isVisible, measureHost]);

  useEffect(() => {
    if (!isVisible) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const focusWasInTooltip = Boolean(
        document.activeElement && tooltipRef.current?.contains(document.activeElement),
      );
      event.preventDefault();
      event.stopPropagation();
      // Move focus while the portal still exists, then hide. Focusing after
      // unmount would trigger the host's onFocus and immediately reopen it.
      if (focusWasInTooltip) restoreTriggerFocus();
      hide();
    };
    document.addEventListener('keydown', closeOnEscape, true);
    return () => document.removeEventListener('keydown', closeOnEscape, true);
  }, [hide, isVisible, restoreTriggerFocus]);

  useEffect(() => {
    if (!isVisible || (!openOnClick && !interactive)) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && (hostRef.current?.contains(target) || tooltipRef.current?.contains(target))) return;
      hide();
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, [hide, interactive, isVisible, openOnClick]);

  useLayoutEffect(() => {
    if (!isVisible || !tooltipRef.current || !anchor || !hostRect) return;

    const el = tooltipRef.current;
    // CSS max-height already caps tall sheets; measure after layout
    const tw = el.offsetWidth;
    const th = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let pos = anchor.position;

    // Vertical flip residual: free space is measured from the HOST edges
    // (not the preferred-side anchor point). After flip, re-resolve the
    // anchor so top/bottom sit on the correct edge — W7 flip reused the
    // original side's point and left sheets overlapping the trigger.
    const spaceBelow = vh - hostRect.bottom - VIEWPORT_PAD;
    const spaceAbove = hostRect.top - VIEWPORT_PAD;
    const spaceRight = vw - hostRect.right - VIEWPORT_PAD;
    const spaceLeft = hostRect.left - VIEWPORT_PAD;
    if (pos === 'bottom' && th > spaceBelow && spaceAbove > spaceBelow) {
      pos = 'top';
    } else if (pos === 'top' && th > spaceAbove && spaceBelow > spaceAbove) {
      pos = 'bottom';
    } else if (pos === 'right' && tw > spaceRight && spaceLeft > spaceRight) {
      pos = 'left';
    } else if (pos === 'left' && tw > spaceLeft && spaceRight > spaceLeft) {
      pos = 'right';
    }

    const resolved = resolveAnchor(hostRect, pos);

    let dx = 0;
    let dy = 0;
    if (pos === 'bottom') {
      dx = -tw / 2;
    } else if (pos === 'top') {
      dx = -tw / 2;
      dy = -th;
    } else if (pos === 'left') {
      dx = -tw;
      dy = -th / 2;
    } else {
      dy = -th / 2;
    }

    let left = resolved.left + dx;
    let top = resolved.top + dy;

    if (left < VIEWPORT_PAD) left = VIEWPORT_PAD;
    if (left + tw > vw - VIEWPORT_PAD) left = Math.max(VIEWPORT_PAD, vw - VIEWPORT_PAD - tw);
    if (top < VIEWPORT_PAD) top = VIEWPORT_PAD;
    if (top + th > vh - VIEWPORT_PAD) top = Math.max(VIEWPORT_PAD, vh - VIEWPORT_PAD - th);

    const clamped = pos !== anchor.position || left !== resolved.left + dx || top !== resolved.top + dy;
    setPlacement((current) => {
      if (
        current &&
        current.top === top &&
        current.left === left &&
        current.clamped === clamped &&
        current.measured &&
        current.position === pos
      ) {
        return current;
      }
      return { top, left, clamped, measured: true, position: pos };
    });
  }, [isVisible, anchor, hostRect, resolveAnchor]);

  if (!FeatureFlags.ENABLE_TOOLTIPS) {
    return <div className={className}>{children}</div>;
  }

  const pos = placement?.position ?? anchor?.position ?? preferredPosition;
  const tooltipClass = [
    'tooltip',
    `tooltip--${pos}`,
    placement?.measured ? 'tooltip--measured' : '',
    placement?.clamped ? 'tooltip--clamped' : '',
  ]
    .filter(Boolean)
    .join(' ');

  let describedChildren = children;
  let hostTabIndex: number | undefined;
  let hostDescription: string | undefined;
  let hostLabel: string | undefined;
  let hostDisabled: boolean | undefined;
  if (
    React.isValidElement<{
      'aria-label'?: string;
      'aria-describedby'?: string;
      'aria-controls'?: string;
      'aria-expanded'?: boolean;
      'aria-hidden'?: boolean | 'true' | 'false';
      disabled?: boolean;
      tabIndex?: number;
      href?: string;
      role?: string;
    }>(children) &&
    children.type !== React.Fragment
  ) {
    const existingDescription = children.props['aria-describedby'];
    const describedBy = [
      existingDescription,
      interactive ? instructionId : undefined,
      isVisible ? tooltipId : undefined,
    ]
      .filter(Boolean)
      .join(' ');
    const intrinsicTag = typeof children.type === 'string' ? children.type : null;
    const isNativeFocusable = Boolean(
      intrinsicTag &&
      !children.props.disabled &&
      (['button', 'input', 'select', 'textarea', 'summary'].includes(intrinsicTag) ||
        (intrinsicTag === 'a' && children.props.href)),
    );
    const needsFocusStop = Boolean(
      intrinsicTag &&
      !isNativeFocusable &&
      !children.props.disabled &&
      children.props.tabIndex == null &&
      children.props['aria-hidden'] !== true &&
      children.props['aria-hidden'] !== 'true',
    );
    describedChildren = React.cloneElement(children, {
      'aria-describedby': describedBy || undefined,
      'aria-controls': openOnClick || interactive ? tooltipId : children.props['aria-controls'],
      'aria-expanded': openOnClick || interactive ? isVisible : children.props['aria-expanded'],
      tabIndex: needsFocusStop ? 0 : children.props.tabIndex,
    });
    if (intrinsicTag && children.props.disabled) {
      hostTabIndex = 0;
      hostDescription = [interactive ? instructionId : undefined, tooltipId]
        .filter(Boolean)
        .join(' ');
      hostLabel = children.props['aria-label'];
      hostDisabled = true;
    }
  }

  const handleHostClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!openOnClick) return;
    event.preventDefault();
    event.stopPropagation();
    if (isPinned) {
      const focusWasInTooltip = Boolean(
        document.activeElement && tooltipRef.current?.contains(document.activeElement),
      );
      if (focusWasInTooltip) restoreTriggerFocus();
      hide();
      return;
    }
    setIsPinned(true);
    show();
    if (event.detail === 0) {
      window.setTimeout(() => tooltipRef.current?.focus({ preventScroll: true }), 0);
    }
  };

  const handleHostKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || event.key !== 'F2') return;
    event.preventDefault();
    event.stopPropagation();
    if (isPinned) {
      restoreTriggerFocus();
      hide();
      return;
    }
    setIsPinned(true);
    show();
    window.setTimeout(() => tooltipRef.current?.focus({ preventScroll: true }), 0);
  };

  return (
    <>
      <div
        ref={hostRef}
        className={className}
        tabIndex={hostTabIndex}
        role={hostDisabled ? 'group' : undefined}
        aria-label={hostLabel}
        aria-disabled={hostDisabled}
        aria-describedby={hostDescription}
        aria-keyshortcuts={interactive ? 'F2' : undefined}
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        onFocus={show}
        onBlur={(event) => {
          const nextTarget = event.relatedTarget as Node | null;
          if (!nextTarget || !event.currentTarget.contains(nextTarget)) scheduleHide();
        }}
        onClick={openOnClick ? handleHostClick : undefined}
        onKeyDown={interactive ? handleHostKeyDown : undefined}
      >
        {describedChildren}
        {interactive && (
          <span id={instructionId} className="sw-sr-only">
            Press F2 to focus and scroll details. Escape returns to this control.
          </span>
        )}
      </div>
      {isVisible &&
        placement &&
        createPortal(
          <div
            ref={tooltipRef}
            className={tooltipClass}
            style={{ top: placement.top, left: placement.left }}
            role={openOnClick || interactive ? 'dialog' : 'tooltip'}
            aria-label={openOnClick || interactive ? 'Details' : undefined}
            id={tooltipId}
            tabIndex={openOnClick || interactive ? -1 : undefined}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key !== 'Escape') event.stopPropagation();
            }}
            onKeyUp={(event) => event.stopPropagation()}
            onFocus={clearHideTimer}
            onMouseEnter={clearHideTimer}
            onMouseLeave={scheduleHide}
          >
            {content}
            {!placement.clamped && <div className={`tooltip__arrow tooltip__arrow--${pos}`} />}
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;
