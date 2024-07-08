import { useEffect, useState } from "react"

import type { Balance, Token } from "./types"

const useTokenSelection = (balances: any, bitcoinAddress: string) => {
  const [sourceToken, setSourceToken] = useState<string | undefined>()
  const [sourceTokenSelected, setSourceTokenSelected] = useState<Token | null>(
    null
  )
  const [sourceBalances, setSourceBalances] = useState<Balance[]>([])
  const [destinationToken, setDestinationToken] = useState<string | undefined>()
  const [destinationTokenSelected, setDestinationTokenSelected] =
    useState<Token | null>(null)
  const [destinationBalances, setDestinationBalances] = useState<Balance[]>([])

  useEffect(() => {
    const token = balances?.find((b: Balance) => b.id === sourceToken)
    setSourceTokenSelected(token ? token : false)
  }, [sourceToken, balances])

  useEffect(() => {
    const token = balances.find((b: Balance) => b.id === destinationToken)
    setDestinationTokenSelected(token ? token : false)
  }, [destinationToken, balances])

  useEffect(() => {
    setSourceBalances(
      balances
        .filter((b: Balance) => b.balance > 0)
        .sort((a: Balance, b: Balance) =>
          a.chain_name < b.chain_name ? -1 : 1
        )
    )
    setDestinationBalances(
      balances
        .filter((b: Balance) =>
          b.chain_name === "btc_testnet" ? bitcoinAddress : true
        )
        .sort((a: Balance, b: Balance) =>
          a.chain_name < b.chain_name ? -1 : 1
        )
    )
  }, [balances, bitcoinAddress])

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
