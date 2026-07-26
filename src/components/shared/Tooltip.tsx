import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FeatureFlags } from '../../config/featureFlags';
import './shared.css';

type TooltipPosition = 'bottom' | 'right' | 'top' | 'left';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  position?: TooltipPosition;
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
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hostRect, setHostRect] = useState<HostRect | null>(null);
  const [anchor, setAnchor] = useState<AnchorPoint | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

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

  const show = useCallback(
    (target: EventTarget & Element) => {
      if (!FeatureFlags.ENABLE_TOOLTIPS) return;
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
      setPlacement({ top: next.top, left: next.left, clamped: false, position: next.position });
      setIsVisible(true);
    },
    [preferredPosition, resolveAnchor]
  );

  const hide = useCallback(() => {
    setIsVisible(false);
    setHostRect(null);
    setAnchor(null);
    setPlacement(null);
  }, []);

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
    if (pos === 'bottom' && th > spaceBelow && spaceAbove > spaceBelow) {
      pos = 'top';
    } else if (pos === 'top' && th > spaceAbove && spaceBelow > spaceAbove) {
      pos = 'bottom';
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

    setPlacement({ top, left, clamped: true, position: pos });
  }, [isVisible, anchor, hostRect, resolveAnchor]);

  if (!FeatureFlags.ENABLE_TOOLTIPS) {
    return <div className={className}>{children}</div>;
  }

  const pos = placement?.position ?? anchor?.position ?? preferredPosition;
  const tooltipClass = [
    'tooltip',
    `tooltip--${pos}`,
    placement?.clamped ? 'tooltip--clamped' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div
        className={className}
        onMouseEnter={(e) => show(e.currentTarget)}
        onMouseLeave={hide}
        onFocus={(e) => show(e.currentTarget)}
        onBlur={hide}
      >
        {children}
      </div>
      {isVisible &&
        placement &&
        createPortal(
          <div
            ref={tooltipRef}
            className={tooltipClass}
            style={{ top: placement.top, left: placement.left }}
            role="tooltip"
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
