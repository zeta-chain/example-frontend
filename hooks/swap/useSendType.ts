import { useEffect, useState } from "react"

export const computeSendType = (s: any, d: any) => {
  if (!s || !d) return null

  const fromZETA = /\bzeta\b/i.test(s?.symbol)
  const fromZETAorWZETA = /\bw?zeta\b/i.test(s?.symbol)
  const fromZetaChain = s.chain_name === "zeta_testnet"
  const fromBTC = s.symbol === "tBTC"
  const fromBitcoin = s.chain_name === "btc_testnet"
  const fromWZETA = s.symbol === "WZETA"
  const fromGas = s.coin_type === "Gas"
  const fromERC20 = s.coin_type === "ERC20"
  const toZETAorWZETA = /\bw?zeta\b/i.test(d?.symbol)
  const toWZETA = d.symbol === "WZETA"
  const toZETA = d.symbol === "ZETA"
  const toZetaChain = d.chain_name === "zeta_testnet"
  const toGas = d.coin_type === "Gas"
  const toERC20 = d.coin_type === "ERC20"
  const toZRC20 = d.coin_type === "ZRC20"
  const fromZRC20 = s.coin_type === "ZRC20"
  const toBitcoin = d.chain_name === "btc_testnet"
  const sameToken = s.ticker === d.ticker
  const sameChain = s.chain_name === d.chain_name
  const fromToBitcoin = fromBitcoin && toBitcoin
  const fromToZetaChain = fromZetaChain || toZetaChain
  const fromToZETAorWZETA = fromZETAorWZETA || toZETAorWZETA

  const conditions = {
    crossChainZeta: () => fromZETAorWZETA && toZETAorWZETA && !sameChain,
    wrapZeta: () => fromZETA && toWZETA,
    unwrapZeta: () => fromWZETA && toZETA,
    depositNative: () =>
      sameToken &&
      !fromZetaChain &&
      toZetaChain &&
      fromGas &&
      toZRC20 &&
      !fromBTC,
    depositERC20: () =>
      sameToken &&
      !fromZetaChain &&
      toZetaChain &&
      fromERC20 &&
      toZRC20 &&
      !fromBTC &&
      s.zrc20 === d.contract,
    withdrawZRC20: () => sameToken && fromZetaChain && !toZetaChain && !fromBTC,
    transferNativeEVM: () =>
      sameToken && sameChain && fromGas && toGas && !fromToBitcoin,
    transferERC20EVM: () =>
      sameToken &&
      sameChain &&
      ((fromERC20 && toERC20) || (fromZRC20 && toZRC20)) &&
      !fromToBitcoin,
    crossChainSwap: () =>
      !fromToZetaChain && !fromToZETAorWZETA && !sameChain && !fromBTC,
    crossChainSwapTransfer: () =>
      !fromZetaChain && toZetaChain && (toZRC20 || toZETA) && !fromZETAorWZETA,
    fromZetaChainSwapAndWithdraw: () =>
      fromZetaChain && !toZetaChain && !toZETAorWZETA && (toERC20 || toGas),
    fromZetaChainSwap: () =>
      fromZetaChain &&
      toZetaChain &&
      !(fromWZETA || toWZETA) &&
      (toZRC20 || toZETA),
  }

  const result = Object.entries(conditions).find(([_, check]) => check())
  return result ? result[0] : null
}

const useSendType = (
  sourceTokenSelected: any,
  destinationTokenSelected: any
) => {
  const [sendType, setSendType] = useState<any>(null)

  useEffect(() => {
    setSendType(computeSendType(sourceTokenSelected, destinationTokenSelected))
  }, [sourceTokenSelected, destinationTokenSelected])

  return sendType
}

export default useSendType
