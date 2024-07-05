import { useEffect, useState } from "react"
import { useFeesContext } from "@/context/FeesContext"
import { utils } from "ethers"

import { roundNumber } from "@/lib/utils"
import { useZetaChainClient } from "@/hooks/useZetaChainClient"

const useCrossChainFee = (
  sourceTokenSelected: any,
  destinationTokenSelected: any,
  sendType: any
) => {
  const { fees } = useFeesContext()
  const { client } = useZetaChainClient()
  const [crossChainFee, setCrossChainFee] = useState<any>(null)

  useEffect(() => {
    const fetchCrossChainFee = async () => {
      setCrossChainFee(null)
      const fee = await getCrossChainFee(
        sourceTokenSelected,
        destinationTokenSelected
      )
      setCrossChainFee(fee)
    }

    if (sourceTokenSelected && destinationTokenSelected) {
      fetchCrossChainFee()
    }
  }, [sourceTokenSelected, destinationTokenSelected])

  const getCrossChainFee = async (s: any, d: any) => {
    if (!sendType) return
    if (["crossChainZeta"].includes(sendType)) {
      if (!fees) return
      const dest = d?.chain_name
      const toZetaChain = dest === "zeta_testnet"
      const fee = fees["messaging"].find((f: any) => f.chainID === d.chain_id)
      const amount = toZetaChain ? 0 : parseFloat(fee.totalFee)
      const formatted =
        amount === 0 ? "Fee: 0 ZETA" : `Fee: ~${roundNumber(amount)} ZETA`
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
        let fee
        try {
          fee = await client.getWithdrawFeeInInputToken(st, dt)
        } catch (error) {
          console.error("Error fetching withdraw fee:", error)
          return null
        }
        const feeAmount = roundNumber(
          parseFloat(utils.formatUnits(fee.amount, fee.decimals))
        )
        return {
          amount: utils.formatUnits(fee.amount, fee.decimals),
          symbol: s.symbol,
          decimals: fee.decimals,
          formatted: `Fee: ${feeAmount} ${s.symbol}`,
        }
      }
    }
  }

  return { crossChainFee }
}

export default useCrossChainFee
