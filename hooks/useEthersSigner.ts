import * as React from "react"
import { providers } from "ethers"
import { useWalletClient, type WalletClient } from "wagmi"

/**
 * Converts a Wallet Client to an ethers.js Signer.
 *
 * @param {WalletClient} walletClient - The wallet client to convert.
 * @returns {providers.JsonRpcSigner} - The ethers.js signer.
 */
export function walletClientToSigner(walletClient: WalletClient) {
  const { account, chain, transport } = walletClient
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  const provider = new providers.Web3Provider(transport, network)
  const signer = provider.getSigner(account.address)
  return signer
}

/**
 * Hook to convert a viem Wallet Client to an ethers.js Signer.
 *
 * @param {object} options - The options object.
 * @param {number} [options.chainId] - The chain ID to use.
 * @returns {providers.JsonRpcSigner|undefined} - The ethers.js signer or undefined.
 */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: walletClient } = useWalletClient({ chainId })
  return React.useMemo(
    () => (walletClient ? walletClientToSigner(walletClient) : undefined),
    [walletClient]
  )
}
