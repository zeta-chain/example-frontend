import { useEffect, useState } from "react"
import { useBalanceContext } from "@/context/BalanceContext"

const useTokenSelection = () => {
  const { balances, bitcoinAddress } = useBalanceContext()
  const [sourceToken, setSourceToken] = useState<any>()
  const [sourceTokenSelected, setSourceTokenSelected] = useState<any>()
  const [sourceBalances, setSourceBalances] = useState<any>()
  const [destinationToken, setDestinationToken] = useState<any>()
  const [destinationTokenSelected, setDestinationTokenSelected] =
    useState<any>()
  const [destinationBalances, setDestinationBalances] = useState<any>()

  useEffect(() => {
    const token = balances?.find((b: any) => b.id === sourceToken)
    setSourceTokenSelected(token ? token : false)
  }, [sourceToken])

  useEffect(() => {
    const token = balances.find((b: any) => b.id === destinationToken)
    setDestinationTokenSelected(token ? token : false)
  }, [destinationToken])

  useEffect(() => {
    setSourceBalances(
      balances
        .filter((b: any) => b.balance > 0)
        .sort((a: any, b: any) => (a.chain_name < b.chain_name ? -1 : 1))
    )
    setDestinationBalances(
      balances
        .filter((b: any) =>
          b.chain_name === "btc_testnet" ? bitcoinAddress : true
        )
        .sort((a: any, b: any) => (a.chain_name < b.chain_name ? -1 : 1))
    )
  }, [balances])

  return {
    sourceToken,
    setSourceToken,
    sourceTokenSelected,
    sourceBalances,
    destinationToken,
    setDestinationToken,
    destinationTokenSelected,
    destinationBalances,
  }
}

export default useTokenSelection
