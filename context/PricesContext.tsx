import React, { createContext, useCallback, useContext, useState } from "react"
import { EvmPriceServiceConnection } from "@pythnetwork/pyth-evm-js"
import { getEndpoints } from "@zetachain/networks/dist/src/getEndpoints"
import debounce from "lodash/debounce"

const PricesContext = createContext<any>(null)

export const PricesProvider = ({ children }: { children: React.ReactNode }) => {
  const [prices, setPrices] = useState<any>([])

  const fetchPrices = useCallback(
    debounce(async () => {
      let priceIds: any = []
      const api = getEndpoints("cosmos-http", "zeta_testnet")[0]?.url

      const zetaChainUrl = `${api}/zeta-chain/fungible/foreign_coins`
      const pythNetworkUrl = "https://benchmarks.pyth.network/v1/price_feeds/"

      try {
        const zetaResponse = await fetch(zetaChainUrl)
        const zetaData = await zetaResponse.json()
        const foreignCoins = zetaData.foreignCoins
        const symbolsFromZeta = foreignCoins.map((coin: any) =>
          coin.symbol.replace(/^[tg]/, "")
        )

        const pythResponse = await fetch(pythNetworkUrl)
        const pythData = await pythResponse.json()
        const priceFeeds = pythData

        priceIds = priceFeeds
          .filter((feed: any) => {
            const base = symbolsFromZeta.includes(feed.attributes.base)
            const quote = feed.attributes.quote_currency === "USD"
            return base && quote
          })
          .map((feed: any) => ({
            symbol: feed.attributes.base,
            id: feed.id,
          }))
      } catch (error) {
        console.error("Error fetching or processing data:", error)
        return []
      }
      const connection = new EvmPriceServiceConnection(
        "https://hermes.pyth.network"
      )

      const priceFeeds = await connection.getLatestPriceFeeds(
        priceIds.map((p: any) => p.id)
      )

      setPrices(
        priceFeeds?.map((p: any) => {
          const pr = p.getPriceNoOlderThan(60)
          return {
            id: p.id,
            symbol: priceIds.find((i: any) => i.id === p.id)?.symbol,
            price: parseInt(pr.price) * 10 ** pr.expo,
          }
        })
      )
    }, 500),
    []
  )

  return (
    <PricesContext.Provider value={{ prices, fetchPrices }}>
      {children}
    </PricesContext.Provider>
  )
}

export const usePricesContext = () => useContext(PricesContext)
