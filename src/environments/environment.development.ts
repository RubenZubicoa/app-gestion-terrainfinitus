export const environment = {
  production: false,
  // apiUrl: 'http://localhost:3000',
  apiUrl: 'https://tienda-pesca-back.vercel.app',
  terrainfinitusApiUrl: 'https://terrainfinitus-back.vercel.app',
  /**
   * Endpoint de la impresora Zebra (o proxy de impresión).
   * Sustituye este valor cuando tengas la URL definitiva.
   * Ejemplo típico Browser Print: http://localhost:9100/write
   */
  zebraPrinterUrl: 'http://localhost:9100/write',
  /** Clave publicable de Stripe (pk_test_...). Nunca uses sk_test_ en el frontend. */
  stripePublishableKey:
    'pk_test_51TlrtY7lKpXfSseIuPx4XtfXhrROIHHPX12MBkThYcKmWTYrts2hWtcSlkMSIPN5HTValMU03S156zXfwjS8i22300VaVdZVwr',
} as const;

