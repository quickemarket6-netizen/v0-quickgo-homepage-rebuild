// Plafond d'espèces en main pour les livreurs : au-delà, plus d'acceptation
// de commandes cash tant que les fonds n'ont pas été remis à la plateforme.
export const CASH_ON_HAND_CAP = Number(process.env.DRIVER_CASH_CAP ?? 50_000)
