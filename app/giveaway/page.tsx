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
  const [giveaways, setGiveaways] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    blockHeight: "",
    prizeAmount: "",
    maxParticipants: "",
    nftContract: "",
    amount: "",
  })
  const [currentChainId, setCurrentChainId] = useState(null)
  const zetaChainRPC = getEndpoints("evm", "zeta_testnet")[0]?.url
  const sepoliaRPC = getEndpoints("evm", "sepolia_testnet")[0]?.url

  const contracts = {
    zeta_testnet: "0xA3F803A329Da0838df8A72409798dF89e3fEc927",
    sepolia_testnet: "0x27cf4b05d90574EFd15787d96Ca71794E7eBAD6F",
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

        for (let i = 0; i < giveawayCounter; i++) {
          const giveaway = await contract.giveaways(i)
          allGiveaways.push(giveaway)
        }

        setGiveaways(allGiveaways)
      } catch (error) {
        console.error("Error fetching giveaways:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGiveaways()
  }, [])

  useEffect(() => {
    const getCurrentChainId = async () => {
      try {
        if (window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum)
          const { chainId } = await provider.getNetwork()
          setCurrentChainId(chainId)
        }
      } catch (error) {
        console.error("Error getting chain ID:", error)
      }
    }

    getCurrentChainId()

    window.ethereum.on("chainChanged", (chainId) => {
      setCurrentChainId(parseInt(chainId, 16))
    })
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const {
    config,
    error: prepareError,
    isError: isPrepareError,
  } = usePrepareContractWrite({
    address: contracts.zeta_testnet,
    abi: CrossChainMessage.abi,
    functionName: "createGiveaway",
    args: [
      BigInt(formData.blockHeight || "0"),
      parseEther(formData.prizeAmount || "0"),
      BigInt(formData.maxParticipants || "0"),
      formData.nftContract,
      BigInt(11155111),
    ],
    value: parseEther(formData.amount || "0"),
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

  const handleSubmit = async (e) => {
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

  const handleParticipate = async (giveawayId) => {
    try {
      const contract = new ethers.Contract(
        contracts.sepolia_testnet,
        CrossChainMessage.abi,
        signer
      )
      await contract.participate(giveawayId)
    } catch (error) {
      console.error("Error participating in giveaway:", error)
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
                  </div>
                  <div>
                    <Button
                      onClick={() => handleParticipate(giveaway.giveawayId)}
                      disabled={currentChainId !== 11155111}
                      variant="outline"
                    >
                      Participate
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
              <Input
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Amount"
                required
              />
              <Button type="submit">Create Giveaway</Button>
            </div>
          </form>
          {isPrepareError && (
            <p className="text-red-500">
              Error preparing transaction: {prepareError.message}
            </p>
          )}
          {isWriteError && (
            <p className="text-red-500">
              Error writing transaction: {writeError.message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default GiveawayPage
