// Plafond d'espèces en main pour les livreurs : au-delà, plus d'acceptation
// de commandes cash tant que les fonds n'ont pas été remis à la plateforme.
export const CASH_ON_HAND_CAP = Number(process.env.DRIVER_CASH_CAP ?? 50_000)

/**
 * Whether a driver may accept a new cash order without breaching the cash cap.
 *
 * Pure and dependency-free so it can be unit-tested: this is a loss-control
 * rule (a driver holding too much of the platform's cash is a real risk).
 * Accepting the order must not push their cash-on-hand strictly above the cap.
 */
export function canAcceptCashOrder(
  cashOnHand: number,
  orderTotal: number,
  cap: number = CASH_ON_HAND_CAP,
): boolean {
  const held = Number(cashOnHand) || 0
  const amount = Number(orderTotal) || 0
  return held + amount <= cap
}
