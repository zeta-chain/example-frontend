"use client"

import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { abi } from "@zetachain/example-contracts/abi/omnichain/NFT.sol/NFT.json"
import { getEndpoints, networks } from "@zetachain/networks"
import { getAddress } from "@zetachain/protocol-contracts"
// @ts-ignore
import { prepareData } from "@zetachain/toolkit/helpers"
import { ethers } from "ethers"
import { AnimatePresence, motion } from "framer-motion"
import { gql, request } from "graphql-request"
import debounce from "lodash/debounce"
import { Flame, Loader, RefreshCw, Send, Sparkles } from "lucide-react"
import { Tilt } from "react-next-tilt"
import { formatUnits, parseEther } from "viem"
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi"

import { useEthersSigner } from "@/lib/ethers"
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

const omnichainContract = "0x7a984BD3ce37257e0124A3c0d25857df5E258Be2"
const GOLDSKY_API =
  "https://api.goldsky.com/api/public/project_clnujea22c0if34x5965c8c0j/subgraphs/mycontract-zetachain-testnet/v4/gn"

const NFTPage = () => {
  const [assets, setAssets] = useState<any>([])
  const [selectedChain, setSelectedChain] = useState<any>(null)
  const [amount, setAmount] = useState<any>("")
  const [assetsReloading, setAssetsReloading] = useState<any>(false)
  const [assetsUpdating, setAssetsUpdating] = useState<any>([])
  const [assetsBurned, setAssetsBurned] = useState<any>([])
  const [mintingInProgress, setMintingInProgress] = useState<any>(false)
  const [recipient, setRecipient] = useState<any>("")
  const {
    bitcoinAddress,
    setInbounds,
    inbounds,
    cctxs,
    connectBitcoin,
    balances,
  } = useContext(AppContext)
  const { switchNetwork } = useSwitchNetwork()
  const { chain } = useNetwork()

  const { address } = useAccount()

  function findUserNFTs(walletAddress: string, transfers: any) {
    let currentOwnership: any = {}
    transfers.sort(
      (a: any, b: any) => parseInt(a.block_number) - parseInt(b.block_number)
    )

    transfers.forEach((transfer: any) => {
      if (transfer.to.toLowerCase() === walletAddress.toLowerCase()) {
        currentOwnership[transfer.tokenId] = true
      } else if (transfer.from.toLowerCase() === walletAddress.toLowerCase()) {
        currentOwnership[transfer.tokenId] = false
      }
    })

    return Object.keys(currentOwnership).filter((id) => currentOwnership[id])
  }

  const query = (address: string) => {
    return gql`
      query {
        transfers(
          first: 100
          where: {
            or: [
              { to: "${address}" }
              { from: "${address}" }
            ]
          }
        ) {
          id
          to
          from
          block_number
          tokenId
        }
      }
    `
  }
  const signer = useEthersSigner()

  const fetchNFTs = useCallback(
    debounce(async () => {
      console.log("Fetching NFTs...")
      setAssetsReloading(true)
      try {
        let ownedNFTs: any = []
        const rpc = getEndpoints("evm", "zeta_testnet")[0]?.url
        const api = getEndpoints("cosmos-http", "zeta_testnet")[0]?.url
        const url = `${api}/zeta-chain/fungible/foreign_coins`
        const zetaResponse = await fetch(url)
        const { foreignCoins } = await zetaResponse.json()

        if (address) {
          const transfers = (await request(
            GOLDSKY_API,
            query(address.toLocaleLowerCase())
          )) as any
          ownedNFTs = findUserNFTs(address, transfers?.transfers)
        }

        const provider = new ethers.providers.StaticJsonRpcProvider(rpc)

        const contract = new ethers.Contract(omnichainContract, abi, provider)

        let nftDetails = await Promise.all(
          ownedNFTs.map(async (id: any) => {
            const chain = (await contract.tokenChains(BigInt(id))).toString()
            const decimals = foreignCoins.find(
              (b: any) =>
                b.coin_type === "Gas" &&
                parseInt(b.foreign_chain_id) === parseInt(chain)
            )?.decimals
            const amount = formatUnits(
              await contract.tokenAmounts(BigInt(id)),
              parseInt(decimals)
            )
            return { id, amount, chain, decimals }
          })
        )
        nftDetails = nftDetails.filter((nft: any) => parseInt(nft.chain) > 0)
        nftDetails.sort((a, b) => parseInt(b.id) - parseInt(a.id))
        setAssets(nftDetails)
      } catch (e) {
        console.log(e)
      } finally {
        setAssetsReloading(false)
      }
    }, 500),
    [address]
  )

  const handleSwitchNetwork = async () => {
    if (chain?.id) {
      switchNetwork?.(selectedChain)
    }
  }

  useEffect(() => {
    fetchNFTs()
  }, [address, JSON.stringify(cctxs)])

  const assetData: any = {
    5: {
      bg: "bg-gradient-to-bl from-[#141414] via-[#343434] to-[#3a3a3a]",
      token: "ETH",
    },
    97: {
      bg: "bg-gradient-to-br from-[#d6a000] via-[#f1bb1e] to-[#ffbe00]",
      token: "BNB",
    },
    18332: {
      bg: "bg-gradient-to-br from-[#f7931a] via-[#f7931a] to-[#ffb04f]",
      token: "BTC",
    },
    80001: {
      bg: "bg-gradient-to-bl from-[#7a40e5] via-[#8640e5] to-[#992fce]",
      token: "MATIC",
    },
  }

  const handleMint = async (c: any) => {
    try {
      setMintingInProgress(true)
      let chainName = Object.entries(networks).find(([key, value]) => {
        return value.chain_id === parseInt(c)
      })?.[0]
      let cctxHash: any
      if (parseInt(c) === 18332) {
        await connectBitcoin()
        window.xfi.bitcoin.request(
          {
            method: "transfer",
            params: [
              {
                feeRate: 10,
                from: bitcoinAddress,
                recipient: getAddress("tss", "btc_testnet"),
                amount: {
                  amount: parseFloat(amount) * 1e8,
                  decimals: 8,
                },
                memo: `${address}`.replace(/^0x/, ""),
              },
            ],
          },
          (error: any, hash: any) => {
            if (!error) {
              cctxHash = hash
            }
          }
        )
      } else {
        const value = parseEther(amount)
        const to = getAddress("tss", chainName as any)
        const data = prepareData(omnichainContract, ["address"], [address])
        const cctx = await signer?.sendTransaction({ data, to, value })
        cctxHash = cctx?.hash
      }
      setAmount("")
      if (cctxHash) {
        const inbound = {
          inboundHash: cctxHash,
          desc: `Minting an NFT`,
        }
        setInbounds([...inbounds, inbound])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setMintingInProgress(false)
    }
  }

  const wrongNetwork =
    !selectedChain ||
    parseInt(selectedChain) === 18332 ||
    parseInt(selectedChain) === chain?.id

  const handleBurn = async (id: any) => {
    try {
      const checkApproval = async (
        id: any,
        contract: any
      ): Promise<boolean | void> => {
        try {
          console.log("Checking approval...")
          const approved = await contract.getApproved(id)
          if (approved.toLowerCase() === omnichainContract.toLowerCase()) {
            console.log("Approved!")
            return true
          } else {
            console.log("Not approved. Asking for approval...")
            await contract.approve(omnichainContract, id)
            for (let i = 0; i < 5; i++) {
              await new Promise((resolve) => setTimeout(resolve, 5000))
              console.log("Checking approval again...")
              const approved = await contract.getApproved(id)
              if (approved.toLowerCase() === omnichainContract.toLowerCase()) {
                console.log("Approved!")
                return true
              }
            }
          }
          console.log("Starting approval process again...")
          checkApproval(id, contract)
        } catch (e) {
          console.error("Approval process cancelled.", e)
          return false
        }
      }

      const checkNFTOwnership = async (nftId: any, contract: any) => {
        console.log("checking ownership")

        try {
          await contract.ownerOf(nftId)
          await new Promise((resolve) => setTimeout(resolve, 5000))
          checkNFTOwnership(nftId, contract)
        } catch (e) {
          console.log("Ownership transferred.")
          setAssetsBurned((b: any) => (b.includes(id) ? b : [...b, id]))
          setAssetsUpdating(assetsUpdating.filter((a: any) => a !== nftId))
          await fetchNFTs()
          return
        }
      }

      setAssetsUpdating((b: any) => (b.includes(id) ? b : [...b, id]))
      const contract = new ethers.Contract(omnichainContract, abi, signer)
      if (await checkApproval(id, contract)) {
        const cctxHash = await contract.burnNFT(parseInt(id), address)
        await checkNFTOwnership(id, contract)
        const inbound = {
          inboundHash: cctxHash.hash,
          desc: `Burning an NFT`,
        }
        setInbounds([...inbounds, inbound])
      } else {
        setAssetsUpdating(assetsUpdating.filter((a: any) => a !== id))
        console.error("Burn cancelled.")
      }
    } catch (e) {
      console.error(e)
      setAssetsUpdating(assetsUpdating.filter((a: any) => a !== id))
    }
  }

  const handleTransfer = async (id: any) => {
    const checkNFTOwnership = async (nftId: any, contract: any) => {
      console.log("checking ownership")

      const owner = await contract.ownerOf(nftId)
      await new Promise((resolve) => setTimeout(resolve, 5000))
      if (owner === address) {
        checkNFTOwnership(nftId, contract)
      } else {
        console.log("Ownership transferred.")
        await fetchNFTs()
        setAssetsUpdating(assetsUpdating.filter((a: any) => a !== id))
      }
    }

    try {
      setAssetsUpdating((b: any) => (b.includes(id) ? b : [...b, id]))
      const contract = new ethers.Contract(omnichainContract, abi, signer)
      await contract.transferFrom(address, recipient, id)
      await checkNFTOwnership(id, contract)
    } catch (e) {
      setAssetsUpdating(assetsUpdating.filter((a: any) => a !== id))
    }
  }

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
                {Object.keys(assetData).map((id: any) => (
                  <SelectItem key={id} value={id}>
                    {assetData[id]?.token}
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
                onClick={() => handleMint(selectedChain)}
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
          {assets &&
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
                              assetData[asset?.chain]?.bg
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
                              {assetData[asset?.chain]?.token}
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
                                handleBurn(asset.id)
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
                                    onClick={() => handleTransfer(asset.id)}
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
