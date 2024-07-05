import { useEffect, useState } from "react"
import { useFeesContext } from "@/context/FeesContext"
import { utils } from "ethers"

import { roundNumber } from "@/lib/utils"
import { useZetaChainClient } from "@/hooks/useZetaChainClient"

import type { CrossChainFee, Token } from "./types"

const useCrossChainFee = (
  sourceTokenSelected: Token | null,
  destinationTokenSelected: Token | null,
  sendType: string | null
) => {
  const { fees } = useFeesContext()
  const { client } = useZetaChainClient()
  const [crossChainFee, setCrossChainFee] = useState<CrossChainFee | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    const fetchCrossChainFee = async () => {
      setLoading(true)
      setCrossChainFee(null)
      try {
        const fee = await getCrossChainFee(
          sourceTokenSelected,
          destinationTokenSelected
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
  }, [sourceTokenSelected, destinationTokenSelected, sendType])

  const getCrossChainFee = async (
    s: Token | null,
    d: Token | null
  ): Promise<CrossChainFee | null> => {
    if (!sendType || !s || !d) return null

    if (["crossChainZeta"].includes(sendType)) {
      if (!fees) return null
      const dest = d.chain_name
      const toZetaChain = dest === "zeta_testnet"
      const fee = fees["messaging"].find(
        (f: { chainID: number }) => f.chainID === d.chain_id
      )
      if (!fee) return null
      const amount = toZetaChain ? "0" : fee.totalFee
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
