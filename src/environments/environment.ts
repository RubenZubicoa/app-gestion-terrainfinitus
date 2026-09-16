export const environment = {
  production: false,
  apiUrl: 'https://tienda-pesca-back.vercel.app',
  terrainfinitusApiUrl: 'https://terrainfinitus-back.vercel.app',
  /**
   * Endpoint de la impresora Zebra (o proxy de impresión).
   * Sustituye este valor cuando tengas la URL definitiva.
   */
  zebraPrinterUrl: 'http://localhost:9100/write',
  stripePublishableKey: '',
} as const;

