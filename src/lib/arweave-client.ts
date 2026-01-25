/**
 * Client-safe Arweave utilities
 * These functions can be used in client components without Node.js dependencies
 */

// Arweave gateway URL
const ARWEAVE_GATEWAY = 'https://arweave.net';

/**
 * Get a URL for an Arweave transaction by transaction ID
 * Client-safe version (no Node.js dependencies)
 * @param txId The Arweave transaction ID
 * @returns The URL to access the file
 */
export function getArweaveUrl(txId: string): string {
  if (!txId) return '';
  return `${ARWEAVE_GATEWAY}/${txId}`;
}
