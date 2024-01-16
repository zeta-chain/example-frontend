"use client"

import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { getEndpoints, networks } from "@zetachain/networks"
import { getAddress } from "@zetachain/protocol-contracts"
import { prepareData } from "@zetachain/toolkit/helpers"
import { ethers } from "ethers"
import { gql, request } from "graphql-request"
import { set } from "lodash"
import debounce from "lodash/debounce"
import isEqual from "lodash/isEqual"
import { Flame, RefreshCw, Send, Sparkles } from "lucide-react"
import { Tilt } from "react-next-tilt"
import { formatUnits, parseEther } from "viem"
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi"

import { useEthersSigner } from "@/lib/ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AppContext } from "@/app/index"

const omnichainContract = "0x3d026bE559797557Fa215f9F7EB4e8BE89fD7d6f"

const abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "tokenAmounts",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "tokenChains",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "recipient",
        type: "bytes",
      },
    ],
    name: "burnNFT",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getApproved",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ownerOf",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
]

const NFTPage = () => {
  const [assets, setAssets] = useState<any>([])
  const [selectedChain, setSelectedChain] = useState<any>(null)
  const [amount, setAmount] = useState<any>("")
  const [assetsReloading, setAssetsReloading] = useState<any>(false)
  const [assetsUpdating, setAssetsUpdating] = useState<any>([])
  const { balances, bitcoinAddress, setInbounds, inbounds, fees, cctxs } =
    useContext(AppContext)
  const { switchNetwork } = useSwitchNetwork()
  const { chain } = useNetwork()

  function useDeepCompareEffect(callback: any, dependencies: any) {
    const currentDependenciesRef = useRef()

    if (!isEqual(currentDependenciesRef.current, dependencies)) {
      currentDependenciesRef.current = dependencies
    }

    useEffect(() => {
      return callback()
    }, [currentDependenciesRef.current])
  }

  const API =
    "https://api.goldsky.com/api/public/project_clnujea22c0if34x5965c8c0j/subgraphs/mycontract-zetachain-testnet/v3/gn"

  const { address, isConnected } = useAccount()

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
      setAssetsReloading(true)
      try {
        let ownedNFTs: any = []
        const rpc = getEndpoints("evm", "zeta_testnet")[0]?.url
        if (address) {
          const transfers = (await request(
            API,
            query(address.toLocaleLowerCase())
          )) as any
          ownedNFTs = findUserNFTs(address, transfers?.transfers)
        }

        const provider = new ethers.providers.StaticJsonRpcProvider(rpc)

        const contract = new ethers.Contract(omnichainContract, abi, provider)

        let nftDetails = await Promise.all(
          ownedNFTs.map(async (id: any) => {
            const amount = formatUnits(
              await contract.tokenAmounts(BigInt(id)),
              18
            )
            const chain = (await contract.tokenChains(BigInt(id))).toString()
            return { id, amount, chain }
          })
        )
        nftDetails = nftDetails.filter((nft: any) => parseInt(nft.chain) > 0)
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
    if (chain.id) {
      switchNetwork?.(selectedChain)
    }
  }

  useEffect(() => {
    fetchNFTs()
  }, [address])

  // useDeepCompareEffect(() => {
  //   console.log("cctxs have changed")
  //   fetchNFTs()
  // }, [cctxs])

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
    let chainName = Object.entries(networks).find(([key, value]) => {
      return value.chain_id === parseInt(c)
    })?.[0]
    let cctxHash
    if (parseInt(c) === 18332) {
      window.xfi.bitcoin.request(
        {
          method: "transfer",
          params: [
            {
              feeRate: 10,
              from: bitcoinAddress,
              recipient: "tb1qy9pqmk2pd9sv63g27jt8r657wy0d9ueeh0nqur",
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
      const cctx = await signer.sendTransaction({ data, to, value })
      cctxHash = cctx.hash
    }
    setAmount("")
    const inbound = {
      inboundHash: cctxHash,
      desc: `Minting an NFT`,
    }
    setInbounds([...inbounds, inbound])
  }

  const wrongNetwork =
    !selectedChain ||
    parseInt(selectedChain) === 18332 ||
    parseInt(selectedChain) === chain.id

  const handleBurn = async (id: any) => {
    if (chain.id !== 7001) {
      return await switchNetwork(7001)
    }

    try {
      const checkApproval = async (
        id: any,
        contract: any
      ): Promise<boolean> => {
        console.log("checking approval")
        const initialApprovedAddress = await contract.getApproved(id)
        console.log("approved address", initialApprovedAddress)
        if (
          initialApprovedAddress.toLowerCase() ===
          omnichainContract.toLowerCase()
        ) {
          console.log("approved!")
          return true
        } else {
          await new Promise((resolve) => setTimeout(resolve, 5000))
          checkApproval(id, contract)
        }
        return false
      }

      const checkNFTOwnership = async (nftId: any, contract: any) => {
        console.log("checking ownership")
        const checkStartTime = Date.now()
        let ownershipChecked = false

        while (Date.now() - checkStartTime < 60000) {
          await new Promise((resolve) => setTimeout(resolve, 5000))
          try {
            await contract.ownerOf(nftId)
          } catch (e) {
            console.log("Ownership transferred.")
            ownershipChecked = true
            await fetchNFTs()
            setAssetsUpdating(assetsUpdating.filter((a: any) => a !== nftId))
            ownershipChecked = true
            break
          }

          if (Date.now() - checkStartTime >= 20000 && !ownershipChecked) {
            console.log("Ownership not transferred.")
            setAssetsUpdating(assetsUpdating.filter((a: any) => a !== nftId))
            await checkNFTOwnership(nftId, contract)
            return
          }
        }
      }

      setAssetsUpdating((b: any) => (b.includes(id) ? b : [...b, id]))
      const contract = new ethers.Contract(omnichainContract, abi, signer)
      await checkApproval(id, contract)

      const cctxHash = await contract.burnNFT(parseInt(id), address)
      await checkNFTOwnership(id, contract)

      // const inbound = {
      //   inboundHash: cctxHash.hash,
      //   desc: `Burning an NFT`,
      // }
      // setInbounds([...inbounds, inbound])
    } catch (e) {
      console.error(e)
      setAssetsUpdating(assetsUpdating.filter((a: any) => a !== id))
    }
  }

  return (
    <div className="px-4 mt-12">
      {JSON.stringify(assetsUpdating)}
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
              <SelectContent>
                {Object.keys(assetData).map((id: any) => (
                  <SelectItem key={id} value={id}>
                    {assetData[id]?.token}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-center -translate-y-[50%]">
            <div className="transition-all duration-100 ease-out shadow-2xl shadow-gray-500 rounded-full bg-white">
              {wrongNetwork ? (
                <Button
                  variant="ghost"
                  className="hover:bg-transparent hover:text-zinc-600"
                  disabled={!(amount > 0) || !selectedChain}
                  onClick={() => {
                    handleMint(selectedChain)
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Mint
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="hover:bg-transparent hover:text-zinc-600"
                  onClick={() => {
                    handleSwitchNetwork(selectedChain)
                  }}
                >
                  Switch Network
                </Button>
              )}
            </div>
          </div>
        </div>
        {assets &&
          assets.map((asset: any) => (
            <div className="flex flex-col gap-2" key={asset.id}>
              <div className="group">
                <Tilt lineGlareBlurAmount="40px" scale={1.05}>
                  <div
                    className={`h-60 w-44 rounded-xl p-4 ${
                      assetData[asset?.chain]?.bg
                    }`}
                  >
                    <p
                      className="text-4xl font-semibold
                             text-transparent bg-clip-text
                             bg-gradient-to-br from-white to-transparent
                             text-shadow"
                    >
                      {asset?.amount}
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
                      className="text-2xl font-semibold opacity-50
                             text-transparent bg-clip-text
                             bg-gradient-to-br from-white to-transparent
                             text-shadow mt-5"
                    >
                      # {asset.id}
                    </div>
                  </div>
                </Tilt>
                <div className="flex justify-center -translate-y-[50%]">
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-100 ease-out shadow-2xl shadow-gray-500 rounded-full bg-white">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        handleBurn(asset.id)
                      }}
                      className="hover:bg-transparent hover:text-rose-500"
                    >
                      <Flame className="h-4 w-4" />
                    </Button>
                    {/* <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-transparent hover:text-sky-500"
                    >
                      <Send className="h-4 w-4" />
                    </Button> */}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

export default NFTPage
