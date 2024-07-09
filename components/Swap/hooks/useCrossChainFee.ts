import { useEffect, useState } from "react"
import { ethers, utils } from "ethers"

import { computeSendType } from "@/components/Swap/hooks/useSendType"

import { roundNumber } from "../lib/utils"
import type { CrossChainFee, Token } from "./types"

const useCrossChainFee = (
  sourceTokenSelected: Token | null,
  destinationTokenSelected: Token | null,
  client: any
) => {
  const [crossChainFee, setCrossChainFee] = useState<CrossChainFee | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    const fetchCrossChainFee = async () => {
      setLoading(true)
      setCrossChainFee(null)
      try {
        const st = computeSendType(
          sourceTokenSelected,
          destinationTokenSelected
        )
        const fee = await getCrossChainFee(
          sourceTokenSelected,
          destinationTokenSelected,
          st
        )
        setCrossChainFee(fee)
      } catch (error) {
        console.error("Error fetching cross-chain fee:", error)
      } finally {
        setLoading(false)
      }
    }

    if (sourceTokenSelected && destinationTokenSelected) {
      fetchCrossChainFee()
    }
  }, [sourceTokenSelected, destinationTokenSelected])

  const getCrossChainFee = async (
    s: Token | null,
    d: Token | null,
    sendType: string | null
  ): Promise<CrossChainFee | null> => {
    if (!sendType || !s || !d) return null

    if (["crossChainZeta"].includes(sendType)) {
      const dest = d.chain_name
      console.log("feess....")
      console.log("sendType", sendType)

      const API = client.getEndpoint("cosmos-http", `zeta_testnet`)
      const url = `${API}/zeta-chain/crosschain/convertGasToZeta?chainId=${
        d.chain_id
      }&gasLimit=${500000}`
      const response = await fetch(url)
      if (!response.ok) {
        return null
      }
      const data = await response.json()
      const gasFee = ethers.BigNumber.from(data.outboundGasInZeta)
      const protocolFee = ethers.BigNumber.from(data.protocolFeeInZeta)
      const totalFee = utils.formatUnits(gasFee.add(protocolFee), 18)

      const toZetaChain = dest === "zeta_testnet"
      const amount = toZetaChain ? "0" : totalFee
      const formatted =
        parseFloat(amount) === 0
          ? "Fee: 0 ZETA"
          : `Fee: ~${roundNumber(parseFloat(amount))} ZETA`
      return {
        amount,
        decimals: 18,
        symbol: "ZETA",
        formatted,
      }
    }

    if (
      [
        "withdrawZRC20",
        "crossChainSwap",
        "fromZetaChainSwapAndWithdraw",
      ].includes(sendType)
    ) {
      const st = s.coin_type === "ZRC20" ? s.contract : s.zrc20
      const dt = d.coin_type === "ZRC20" ? d.contract : d.zrc20
      if (st && dt) {
        try {
          const fee = await client.getWithdrawFeeInInputToken(st, dt)
          const feeAmount = roundNumber(
            parseFloat(utils.formatUnits(fee.amount, fee.decimals))
          )
          return {
            amount: utils.formatUnits(fee.amount, fee.decimals),
            symbol: s.symbol,
            decimals: fee.decimals,
            formatted: `Fee: ${feeAmount} ${s.symbol}`,
          }
        } catch (error) {
          console.error("Error fetching withdraw fee:", error)
          return null
        }
      }
    }
    return null
  }

  return { crossChainFee, loading }
}

export default useCrossChainFee
