"use client"

import { useContext, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { debounce } from "lodash"
import { Flame, Loader, RefreshCw, Send, Sparkles } from "lucide-react"
import { Tilt } from "react-next-tilt"
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AppContext } from "@/app/index"

import { useBurn } from "./burn"
import { useFetchNFTs } from "./fetchNFTs"
import { useMint } from "./mint"
import { useTransfer } from "./transfer"
import { useNFT } from "./useNFT"

const NFTPage = () => {
  const {
    assets,
    selectedChain,
    setSelectedChain,
    amount,
    setAmount,
    assetsReloading,
    assetsUpdating,
    assetsBurned,
    mintingInProgress,
    recipient,
    setRecipient,
    foreignCoins,
  } = useNFT()
  const { cctxs } = useContext(AppContext)
  const { switchNetwork } = useSwitchNetwork()
  const { chain } = useNetwork()
  const { transfer } = useTransfer()
  const { mint } = useMint()
  const { burn } = useBurn()
  const { fetchNFTs } = useFetchNFTs()

  const { address } = useAccount()

  const handleSwitchNetwork = async () => {
    if (chain?.id) {
      switchNetwork?.(selectedChain)
    }
  }

  const debouncedFetchNFTs = debounce(fetchNFTs, 1000)

  useEffect(() => {
    debouncedFetchNFTs()
  }, [address, JSON.stringify(cctxs)])

  const colors: any = {
    5: "bg-gradient-to-bl from-[#141414] via-[#343434] to-[#3a3a3a]",
    97: "bg-gradient-to-br from-[#d6a000] via-[#f1bb1e] to-[#ffbe00]",
    18332: "bg-gradient-to-br from-[#f7931a] via-[#f7931a] to-[#ffb04f]",
    80001: "bg-gradient-to-bl from-[#7a40e5] via-[#8640e5] to-[#992fce]",
  }

  const coins = foreignCoins
    .filter((a: any) => a.coin_type === "Gas")
    .map((a: any) => ({ chain_id: a.foreign_chain_id, symbol: a.symbol }))

  const wrongNetwork =
    !selectedChain ||
    parseInt(selectedChain) === 18332 ||
    parseInt(selectedChain) === chain?.id

  const formatAmount = (amount: any) => {
    const a = Number(amount)
    let formatted = a.toPrecision(2)
    return a % 1 === 0 ? parseInt(formatted) : parseFloat(formatted)
  }

  return (
    <div className="px-4 mt-12">
      <div className="flex items-center justify-start gap-2 mb-6">
        <h1 className="leading-10 text-2xl font-bold tracking-tight">
          NFT Library
        </h1>
        <Button size="icon" variant="ghost" onClick={fetchNFTs}>
          <RefreshCw
            className={`h-4 w-4 ${assetsReloading && "animate-spin"}`}
          />
        </Button>
      </div>
      <div className="flex flex-wrap gap-5 mt-10">
        <div>
          <div className="h-60 w-44 rounded-xl p-4 shadow-2xl shadow-gray-300">
            <Input
              placeholder="0"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-4xl font-semibold bg-transparent border-none"
            />
            <Select onValueChange={(e) => setSelectedChain(e)}>
              <SelectTrigger className="w-full border-none bg-transparent text-2xl font-semibold placeholder:text-red-500">
                <SelectValue placeholder="TOKEN" />
              </SelectTrigger>
              <SelectContent className="shadow-2xl border-none rounded-lg">
                {coins.map((c: any) => (
                  <SelectItem key={c.chain_id} value={c.chain_id}>
                    {c.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-center -translate-y-[50%]">
            {wrongNetwork ? (
              <Button
                variant="ghost"
                className="transition-all duration-100 ease-out hover:bg-white disabled:opacity-1 disabled:text-zinc-400 active:scale-95 shadow-2xl shadow-gray-500 rounded-full bg-white"
                disabled={!(amount > 0) || !selectedChain || mintingInProgress}
                onClick={() => mint(selectedChain)}
              >
                {mintingInProgress ? (
                  <Loader className="h-4 w-4 mr-1 animate-spin-slow" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                Mint
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="transition-all duration-100 ease-out hover:bg-white disabled:opacity-1 disabled:text-zinc-400 active:scale-95 shadow-2xl shadow-gray-500 rounded-full bg-white"
                onClick={() => {
                  handleSwitchNetwork()
                }}
              >
                Switch Network
              </Button>
            )}
          </div>
        </div>
        <AnimatePresence>
          {assets.length > 0 &&
            assets.map((asset: any) => {
              return (
                !assetsBurned.includes(asset.id) && (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col gap-2"
                    key={asset.id}
                  >
                    <Popover>
                      <PopoverTrigger>
                        <Tilt lineGlareBlurAmount="40px" scale={1.05}>
                          <div
                            className={`text-left relative h-60 w-44 rounded-xl overflow-hidden p-4 ${
                              colors[asset?.chain]
                            }`}
                          >
                            <div
                              className={`pointer-events-none	transition-all duration-500 bg-black/[.75] w-full h-full absolute top-0 left-0 flex items-center justify-center opacity-${
                                assetsUpdating.includes(asset.id) ? 100 : 0
                              }`}
                            >
                              <Loader
                                className="absolute text-white/[.25] animate-spin-slow"
                                size={48}
                              />
                            </div>

                            <p
                              className="text-4xl font-semibold
                             text-transparent bg-clip-text tracking-tight
                             bg-gradient-to-br from-white to-transparent
                             text-shadow"
                            >
                              {formatAmount(asset?.amount)}
                            </p>
                            <div
                              className="text-2xl font-semibold
                             text-transparent bg-clip-text
                             bg-gradient-to-br from-white to-transparent
                             text-shadow"
                            >
                              {
                                coins.find(
                                  (c: any) => c.chain_id == asset?.chain
                                ).symbol
                              }
                            </div>
                            <div
                              className="text-2xl font-semibold
                             text-transparent bg-clip-text
                             bg-gradient-to-br from-white to-transparent
                             text-shadow mt-5"
                            >
                              # {asset.id}
                            </div>
                          </div>
                        </Tilt>
                      </PopoverTrigger>
                      <PopoverContent
                        sideOffset={-20}
                        className="p-0 w-full transition-all duration-200 ease-linear shadow-2xl shadow-gray-500 rounded-full bg-white border-none"
                      >
                        {chain?.id === 7001 ? (
                          <div>
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={assetsUpdating.includes(asset.id)}
                              onClick={() => {
                                burn(asset.id)
                              }}
                              className="hover:bg-transparent hover:text-rose-500"
                            >
                              <Flame className="h-4 w-4" />
                            </Button>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="hover:bg-transparent hover:text-sky-500"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                align="center"
                                className="bg-white w-64 -ml-10 rounded-xl p-2 shadow-2xl border-none"
                              >
                                <div className="flex flex-col gap-2">
                                  <Input
                                    disabled={assetsUpdating.includes(asset.id)}
                                    placeholder="Recipient address"
                                    value={recipient}
                                    onChange={(e) =>
                                      setRecipient(e.target.value)
                                    }
                                  />
                                  <Button
                                    disabled={assetsUpdating.includes(asset.id)}
                                    variant="outline"
                                    onClick={() => transfer(asset.id)}
                                  >
                                    Transfer asset
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        ) : (
                          <div>
                            <Button
                              variant="ghost"
                              className="transition-all duration-100 ease-out hover:bg-white disabled:opacity-1 disabled:text-zinc-400 active:scale-95 shadow-2xl shadow-gray-500 rounded-full bg-white"
                              onClick={() =>
                                switchNetwork && switchNetwork(7001)
                              }
                            >
                              Switch Network
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </motion.div>
                )
              )
            })}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default NFTPage
