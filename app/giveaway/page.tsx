"use client"

import React, { useEffect, useState } from "react"
import { getEndpoints } from "@zetachain/networks"
import { ethers } from "ethers"
import { parseEther } from "ethers/lib/utils"
import { useContractWrite, usePrepareContractWrite } from "wagmi"

import { useEthersSigner } from "@/lib/ethers"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import CrossChainMessage from "./CrossChainMessage.json"

const GiveawayPage = () => {
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
  })
  const [currentChainId, setCurrentChainId] = useState<number | null>(null)
  const zetaChainRPC = getEndpoints("evm", "zeta_testnet")[0]?.url
  const sepoliaRPC = getEndpoints("evm", "sepolia_testnet")[0]?.url

  const contracts = {
    zeta_testnet: "0xC275e1f5Aff9136BF544b9c67b7D514E9941004C",
    sepolia_testnet: "0x10b083940b3A90DB162C591954Cb33136b0Aae15",
  }
  const signer = useEthersSigner()

  useEffect(() => {
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
        }

        setGiveaways(allGiveaways as any)
      } catch (error) {
        console.error("Error fetching giveaways:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGiveaways()
  }, [])

  const fetchRequirements = async (giveawayId: string) => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(sepoliaRPC)
      const contract = new ethers.Contract(
        contracts.sepolia_testnet,
        CrossChainMessage.abi,
        provider
      )
      const giveawayRequirements = await contract.requirements(giveawayId)
      console.log(giveawayRequirements)
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
      const participantsList = []

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

  useEffect(() => {
    const w = window as any
    const getCurrentChainId = async () => {
      try {
        if (w.ethereum) {
          const provider = new ethers.providers.Web3Provider(w.ethereum)
          const { chainId } = await provider.getNetwork()
          setCurrentChainId(chainId)
        }
      } catch (error) {
        console.error("Error getting chain ID:", error)
      }
    }

    getCurrentChainId()

    if (w.ethereum) {
      w.ethereum.on("chainChanged", (chainId: string) => {
        setCurrentChainId(parseInt(chainId, 16))
      })
    }
  }, [])

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
    if (write) {
      try {
        await write()
      } catch (error) {
        console.error("Transaction error:", error)
      }
    } else {
      console.error("Unable to write to contract")
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

  const handleMint = (nftContractAddress: string) => async () => {
    try {
      const nftContract = new ethers.Contract(
        nftContractAddress,
        ["function mintTo(address recipient) public returns (uint256)"],
        signer
      )
      if (signer) await nftContract.mintTo(await signer.getAddress())
    } catch (error) {
      console.error("Error minting NFT:", error)
    }
  }

  return (
    <div className="p-4">
      <div className="grid sm:grid-cols-3 gap-x-10 mt-12">
        <div className="sm:col-span-2 overflow-x-scroll">
          <h1 className="text-2xl font-bold leading-tight tracking-tight mt-6 mb-4">
            Giveaways
          </h1>
          {isLoading ? (
            <p>Loading giveaways...</p>
          ) : giveaways.length === 0 ? (
            <p>No giveaways available</p>
          ) : (
            <div className="flex flex-col w-full items-start space-y-4">
              {giveaways.map((giveaway, index) => (
                <Card className="w-full p-4 space-y-4" key={index}>
                  <div>
                    <p>Creator: {giveaway.creator}</p>
                    <p>Block Height: {giveaway.blockHeight.toString()}</p>
                    <p>Prize Amount: {giveaway.prizeAmount.toString()}</p>
                    <p>
                      Max Participants: {giveaway.maxParticipants.toString()}
                    </p>
                    <p>NFT Contract: {giveaway.nftContract}</p>
                    <p>Giveaway ID: {giveaway.giveawayId.toString()}</p>
                    {giveaway.nftContract !==
                      "0x0000000000000000000000000000000000000000" &&
                    requirements[giveaway.giveawayId.toString()] ? (
                      <p className="text-green-500">Has Requirements</p>
                    ) : (
                      <p className="text-red-500">No Requirements</p>
                    )}
                  </div>
                  <div>
                    <h3>Participants:</h3>
                    <ul>
                      {participants[giveaway.giveawayId.toString()]?.map(
                        (participant, idx) => (
                          <li key={idx}>{participant}</li>
                        )
                      )}
                    </ul>
                  </div>
                  <div className="flex space-x-4">
                    <Button
                      onClick={() => handleParticipate(giveaway.giveawayId)}
                      disabled={currentChainId !== 11155111}
                      variant="outline"
                    >
                      Participate
                    </Button>
                    <Button
                      onClick={handleMint(giveaway.nftContract)}
                      disabled={currentChainId !== 11155111}
                      variant="outline"
                    >
                      Mint NFT
                    </Button>
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
                name="blockHeight"
                value={formData.blockHeight}
                onChange={handleInputChange}
                placeholder="Block Height"
                className="flex w-full"
                required
              />
              <Input
                name="prizeAmount"
                value={formData.prizeAmount}
                onChange={handleInputChange}
                placeholder="Prize Amount"
                required
              />
              <Input
                name="maxParticipants"
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
              <Button type="submit">Create Giveaway</Button>
            </div>
          </form>
          {isPrepareError && (
            <p className="text-red-500">
              Error preparing transaction: {prepareError?.message}
            </p>
          )}
          {isWriteError && (
            <p className="text-red-500">
              Error writing transaction: {writeError?.message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default GiveawayPage
