/**
 * Event activity session — room identity that must survive UI desync.
 *
 * The room event is not completed until terminal outcome close (or combat entry).
 * selectedBranchingRoom / currentRoomId can drift while the outcome modal is up,
 * so we bind roomId when the event opens and prefer it on complete.
 */

/** Room that owns the currently open (or mid-chain) event activity. */
export const eventSessionRoomIdRef: { current: string | null } = { current: null };

export function bindEventSessionRoom(roomId: string | null | undefined): void {
  eventSessionRoomIdRef.current = roomId ?? null;
}

export function clearEventSessionRoom(): void {
  eventSessionRoomIdRef.current = null;
}

export function getEventSessionRoomId(): string | null {
  return eventSessionRoomIdRef.current;
}
