"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { ethers } from "ethers"
import { parseEther } from "ethers/lib/utils"
import {
  ArrowUpRight,
  CircleCheck,
  RefreshCw,
  UserCircleIcon,
} from "lucide-react"
import { useAccount, useContractWrite, usePrepareContractWrite } from "wagmi"

import { useEthersSigner } from "@/lib/ethers"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import CrossChainMessage from "./CrossChainMessage.json"
import {
  ethAddressToSingleEmoji,
  getRandomRotation,
  hexToColor,
} from "./helpers"

const GiveawayPage = () => {
  const contracts = {
    zeta_testnet: "0x9D8d5c67802AB0CB2f17260C2F9e2EC631Ca16fe",
    sepolia_testnet: "0x6EA97C9f23a3889B12d322F446C4b9017D981FCE",
  }

  const [currentBlockHeight, setCurrentBlockHeight] = useState<number | null>(
    null
  )
  const fetchCurrentBlockHeight = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(zetaChainRPC)
      const blockNumber = await provider.getBlockNumber()
      setCurrentBlockHeight(blockNumber)
    } catch (error) {
      console.error("Error fetching current block height:", error)
    }
  }
  const [requirements, setRequirements] = useState<{ [key: string]: string }>(
    {}
  )
  const [giveaways, setGiveaways] = useState<any[]>([])
  const [participants, setParticipants] = useState<{ [key: string]: string[] }>(
    {}
  )
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    blockHeight: "",
    prizeAmount: "",
    maxParticipants: "",
    nftContract: "",
    title: "",
  })
  const [currentChainId, setCurrentChainId] = useState<number | null>(null)
  const [userAddress, setUserAddress] = useState<string | null>(null)
  const zetaChainRPC = `https://zetachain-athens.g.allthatnode.com/archive/evm/${process.env.NEXT_PUBLIC_ATN_KEY}`
  const sepoliaRPC = `https://ethereum-sepolia.g.allthatnode.com/full/evm/${process.env.NEXT_PUBLIC_ATN_KEY}`
  const [nftOwnership, setNftOwnership] = useState<{ [key: string]: boolean }>(
    {}
  )
  const { address, isConnected } = useAccount()

  const signer = useEthersSigner()

  const handleDistributeRewards = async (giveawayId: any) => {
    try {
      const contract = new ethers.Contract(
        contracts.zeta_testnet,
        CrossChainMessage.abi,
        signer
      )
      await contract.distributeRewards(giveawayId)
      refreshData() // Refresh data after distributing rewards
    } catch (error) {
      console.error("Error distributing rewards:", error)
    }
  }

  const fetchGiveaways = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(zetaChainRPC)
      const contract = new ethers.Contract(
        contracts.zeta_testnet,
        CrossChainMessage.abi,
        provider
      )

      const giveawayCounter = await contract.giveawayCounter()
      const allGiveaways = []

      for (let i = giveawayCounter - 1; i >= 0; i--) {
        const giveaway = await contract.giveaways(i)
        allGiveaways.push(giveaway)
        await fetchRequirements(giveaway.giveawayId.toString())
        await fetchParticipants(giveaway.giveawayId.toString())

        // Check NFT ownership for each giveaway
        if (
          giveaway.nftContract !==
            "0x0000000000000000000000000000000000000000" &&
          address
        ) {
          await checkNftOwnership(
            giveaway.nftContract,
            address,
            giveaway.giveawayId.toString()
          )
        }

        // await delay(500)
      }

      setGiveaways(allGiveaways as any)
    } catch (error) {
      console.error("Error fetching giveaways:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRequirements = async (giveawayId: string) => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(sepoliaRPC)
      const contract = new ethers.Contract(
        contracts.sepolia_testnet,
        CrossChainMessage.abi,
        provider
      )
      const giveawayRequirements = await contract.requirements(giveawayId)
      if (giveawayRequirements === "0x0000000000000000000000000000000000000000")
        return
      setRequirements((prev) => ({
        ...prev,
        [giveawayId]: giveawayRequirements,
      }))
    } catch (error) {
      console.error("Error fetching requirements:", error)
    }
  }

  const fetchParticipants = async (giveawayId: string) => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(zetaChainRPC)
      const contract = new ethers.Contract(
        contracts.zeta_testnet,
        CrossChainMessage.abi,
        provider
      )
      const participantCounter = await contract.participantCounters(giveawayId)
      const participantsList: any = []

      for (let i = 0; i < participantCounter; i++) {
        const participant = await contract.participants(giveawayId, i)
        participantsList.push(participant)
      }

      setParticipants((prev) => ({
        ...prev,
        [giveawayId]: participantsList,
      }))
    } catch (error) {
      console.error("Error fetching participants:", error)
    }
  }

  const checkNftOwnership = async (
    nftContract: string,
    userAddress: string,
    giveawayId: string
  ) => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(sepoliaRPC)
      const contract = new ethers.Contract(
        nftContract,
        ["function balanceOf(address owner) view returns (uint256)"],
        provider
      )
      const balance = await contract.balanceOf(userAddress)
      console.log("nft check", nftContract, userAddress, balance)
      setNftOwnership((prev) => ({
        ...prev,
        [giveawayId]: balance.toNumber() > 0,
      }))
    } catch (error) {
      console.error("Error checking NFT ownership:", error)
      setNftOwnership((prev) => ({
        ...prev,
        [giveawayId]: false,
      }))
    }
  }

  useEffect(() => {
    const w = window as any
    const getCurrentChainId = async () => {
      try {
        if (w.ethereum) {
          const provider = new ethers.providers.Web3Provider(w.ethereum)
          const { chainId } = await provider.getNetwork()
          setCurrentChainId(chainId)
          const signer = provider.getSigner()
          const address = await signer.getAddress()
          setUserAddress(address)

          // Fetch giveaways once the user address is set
          await fetchGiveaways()
        }
      } catch (error) {
        console.error("Error getting chain ID or address:", error)
      }
    }

    const fetchInitialData = async () => {
      await getCurrentChainId()
      await fetchCurrentBlockHeight()
    }

    fetchInitialData()

    if (w.ethereum) {
      w.ethereum.on("chainChanged", async (chainId: string) => {
        setCurrentChainId(parseInt(chainId, 16))
        await fetchCurrentBlockHeight()
      })
    }
  }, [address])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const prizeAmount = parseEther(formData.prizeAmount || "0").toBigInt()
  const maxParticipants = BigInt(formData.maxParticipants || "0")
  const amount = prizeAmount * maxParticipants + BigInt(4 * 10 ** 18)

  const {
    config,
    error: prepareError,
    isError: isPrepareError,
  } = usePrepareContractWrite({
    address: contracts.zeta_testnet as `0x${string}`,
    abi: CrossChainMessage.abi,
    functionName: "createGiveaway",
    args: [
      BigInt(formData.blockHeight || "0"),
      prizeAmount,
      maxParticipants,
      formData.nftContract,
      BigInt(11155111),
      formData.title,
    ],
    value: amount,
    enabled:
      !!formData.blockHeight &&
      !!formData.prizeAmount &&
      !!formData.maxParticipants &&
      !!formData.nftContract,
  })

  const {
    write,
    error: writeError,
    isError: isWriteError,
  } = useContractWrite(config)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (write && currentChainId === 7001) {
      try {
        await write()
      } catch (error) {
        console.error("Transaction error:", error)
      }
    } else {
      console.error("Unable to write to contract or incorrect chain ID")
    }
  }

  const handleParticipate = async (giveawayId: any) => {
    try {
      const contract = new ethers.Contract(
        contracts.sepolia_testnet,
        CrossChainMessage.abi,
        signer
      )
      await contract.participate(giveawayId, {
        value: parseEther("0.01"),
      })
      fetchParticipants(giveawayId.toString())
    } catch (error) {
      console.error("Error participating in giveaway:", error)
    }
  }

  const refreshData = async () => {
    setIsLoading(true)
    await fetchGiveaways()
  }

  return (
    <div className="p-4">
      <div className="grid sm:grid-cols-3 gap-x-10 mt-12">
        <div className="sm:col-span-2 overflow-x-scroll">
          <div className="flex items-center justify-start mt-6 mb-4 gap-1">
            <h1 className="text-2xl font-bold leading-tight tracking-tight">
              Giveaways
            </h1>
            <Button size="icon" variant="ghost" onClick={refreshData}>
              <RefreshCw className={`h-4 w-4 ${isLoading && "animate-spin"}`} />
            </Button>
          </div>
          {isLoading ? (
            <p>Loading giveaways...</p>
          ) : giveaways.length === 0 ? (
            <p>No giveaways available</p>
          ) : (
            <div className="flex flex-col w-full items-start space-y-4">
              {giveaways.map((giveaway, index) => (
                <Card className="w-full p-6 space-y-4" key={index}>
                  <div>
                    <div className="grid gap-y-6">
                      <div className="grid grid-cols-2">
                        <div>
                          <div className="mb-4">{giveaway.title}</div>
                          <h2 className="text-gray-400 uppercase text-xs tracking-wider font-bold">
                            Prize
                          </h2>
                          <h3 className="text-2xl font-bold leading-tight tracking-tight">
                            {`${ethers.utils.formatEther(
                              giveaway.prizeAmount.toString()
                            )} ZETA`}
                          </h3>
                        </div>
                        <div className="uppercase text-xs tracking-wider font-bold flex justify-end space-x-4">
                          <div className="flex">
                            {
                              participants[giveaway.giveawayId.toString()]
                                ?.length
                            }{" "}
                            / {giveaway.maxParticipants.toString()}
                            <UserCircleIcon className="h-4 h-4" />
                          </div>
                          <div>
                            {giveaway.nftContract !==
                              "0x0000000000000000000000000000000000000000" &&
                            requirements[giveaway.giveawayId.toString()]
                              ? "Ongoing"
                              : "Coming soon"}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 items-end">
                        <div className="space-y-2">
                          <h2 className="text-gray-400 uppercase text-xs tracking-wider font-bold">
                            Requirements to Qualify
                          </h2>
                          <div>
                            <Link
                              href={{
                                pathname: "/giveaway/nft",
                                query: { address: giveaway.nftContract },
                              }}
                              className="flex pt-2 space-x-4 items-center"
                            >
                              <div
                                className="flex items-center justify-center rounded-lg transition-transform"
                                style={{
                                  transform: `rotate(${getRandomRotation()}deg)`,
                                  backgroundColor: hexToColor(
                                    giveaway.nftContract
                                  ),
                                }}
                              >
                                <div className="text-2xl py-4 px-3">
                                  {ethAddressToSingleEmoji(
                                    giveaway.nftContract
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center">
                                  <span>Own an NFT on Ethereum</span>{" "}
                                  <ArrowUpRight className="h-4 w-4" />
                                </div>
                                {nftOwnership[
                                  giveaway.giveawayId.toString()
                                ] && (
                                  <div className="text-gray-500 text-sm flex items-center gap-1">
                                    <CircleCheck className="h-4 w-4" />
                                    <div>You already qualify</div>
                                  </div>
                                )}
                              </div>
                            </Link>
                          </div>
                        </div>
                        {address && (
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() =>
                                handleParticipate(giveaway.giveawayId)
                              }
                              disabled={
                                currentChainId !== 11155111 ||
                                participants[
                                  giveaway.giveawayId.toString()
                                ]?.includes(address) ||
                                !nftOwnership[giveaway.giveawayId.toString()]
                              }
                              variant="outline"
                            >
                              {participants[
                                giveaway.giveawayId.toString()
                              ]?.includes(address)
                                ? "You're in"
                                : "Participate"}
                            </Button>
                            {currentBlockHeight !== null &&
                              currentBlockHeight >
                                parseInt(giveaway.blockHeight.toString()) &&
                              giveaway.nftContract !==
                                "0x0000000000000000000000000000000000000000" &&
                              requirements[giveaway.giveawayId.toString()] && (
                                <Button
                                  onClick={() =>
                                    handleDistributeRewards(giveaway.giveawayId)
                                  }
                                  disabled={currentChainId !== 7001}
                                >
                                  Get rewards!
                                </Button>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="sm:col-span-1 relative order-first sm:order-last">
          <h1 className="text-2xl font-bold leading-tight tracking-tight mt-6 mb-4">
            New Giveaway
          </h1>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col w-full items-start space-y-4">
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Title"
                className="flex w-full"
                required
              />
              <Input
                name="blockHeight"
                value={formData.blockHeight}
                type="number"
                onChange={handleInputChange}
                placeholder="Block Height"
                className="flex w-full"
                required
              />
              <Input
                name="prizeAmount"
                type="number"
                value={formData.prizeAmount}
                onChange={handleInputChange}
                placeholder="Prize Amount"
                required
              />
              <Input
                name="maxParticipants"
                type="number"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                placeholder="Max Participants"
                required
              />
              <Input
                name="nftContract"
                value={formData.nftContract}
                onChange={handleInputChange}
                placeholder="NFT Contract"
                required
              />
              <Button type="submit" disabled={currentChainId !== 7001}>
                Create Giveaway
              </Button>
            </div>
          </form>
          <div className="text-xs my-4 text-red-500">
            {isPrepareError && (
              <p>Error preparing transaction: {prepareError?.message}</p>
            )}
            {isWriteError && (
              <p>Error writing transaction: {writeError?.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GiveawayPage
