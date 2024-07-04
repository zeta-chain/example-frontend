import { useEffect, useState } from "react"
import { ZetaChainClient } from "@zetachain/toolkit/client"
import { utils } from "ethers"

type Token = {
  symbol: string
  chain_name: string
  coin_type: string
  contract?: string
  zrc20?: string
  chain_id?: number
  decimals?: number
}

const useCrossChainFee = (
  client: ZetaChainClient,
  sourceToken: Token | undefined,
  destinationToken: Token | undefined,
  sendType: string | null,
  fees: any
) => {
  const [crossChainFee, setCrossChainFee] = useState<any>(null)

  useEffect(() => {
    const fetchCrossChainFee = async () => {
      if (!sendType) return
      let fee = null

      if (sendType === "crossChainZeta" && fees) {
        const dest = destinationToken?.chain_name
        const toZetaChain = dest === "zeta_testnet"
        const feeInfo = fees["messaging"].find(
          (f: any) => f.chainID === destinationToken?.chain_id
        )
        const amount = toZetaChain ? 0 : parseFloat(feeInfo.totalFee)
        const formatted = amount === 0 ? "Fee: 0 ZETA" : `Fee: ~${amount} ZETA`
        fee = { amount, decimals: 18, symbol: "ZETA", formatted }
      } else if (
        [
          "withdrawZRC20",
          "crossChainSwap",
          "fromZetaChainSwapAndWithdraw",
        ].includes(sendType)
      ) {
        const st =
          sourceToken?.coin_type === "ZRC20"
            ? sourceToken?.contract
            : sourceToken?.zrc20
        const dt =
          destinationToken?.coin_type === "ZRC20"
            ? destinationToken?.contract
            : destinationToken?.zrc20
        if (st && dt) {
          try {
            const feeInfo = await client.getWithdrawFeeInInputToken(st, dt)
            const feeAmount = parseFloat(
              utils.formatUnits(feeInfo.amount, feeInfo.decimals)
            )
            fee = {
              amount: utils.formatUnits(feeInfo.amount, feeInfo.decimals),
              symbol: sourceToken?.symbol,
              decimals: feeInfo.decimals,
              formatted: `Fee: ${feeAmount} ${sourceToken?.symbol}`,
            }
          } catch (error) {
            console.error("Error fetching withdraw fee:", error)
          }
        }
      }
      setCrossChainFee(fee)
    }

    fetchCrossChainFee()
  }, [client, sourceToken, destinationToken, sendType, fees])

  return crossChainFee
}

export default useCrossChainFee
