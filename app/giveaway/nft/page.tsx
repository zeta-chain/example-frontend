"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ethers } from "ethers"
import { ArrowLeft } from "lucide-react"

import { useEthersSigner } from "@/lib/ethers"
import { Button } from "@/components/ui/button"

import {
  ethAddressToSingleEmoji,
  getRandomRotation,
  hexToColor,
} from "../helpers"

const NFTPage = () => {
  const signer = useEthersSigner()
  const searchParams = useSearchParams()

  const address = searchParams.get("address")

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

  const renderCards = () => {
    const cards = []
    for (let i = 0; i < 5; i++) {
      address &&
        cards.push(
          <div
            key={i}
            className="absolute h-[375px] w-[250px] rounded-3xl border-8 border-white shadow-2xl shadow-slate-300 transition-transform"
            style={{
              transform: `rotate(${getRandomRotation()}deg) translateY(${
                i * 0
              }px)`,
              backgroundColor: hexToColor(address),
              zIndex: i,
            }}
          >
            {i === 4 && (
              <div className="flex h-full flex-col items-center justify-center gap-6">
                <div className="text-8xl">
                  {ethAddressToSingleEmoji(address)}
                </div>
                <div className="justify-center">
                  <Button
                    onClick={handleMint(address)}
                    className="bg-white/50 text-xs font-bold uppercase tracking-wider text-black hover:bg-white/100"
                  >
                    mint
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
    }
    return cards
  }

  return (
    <div>
      <Button variant="ghost" asChild>
        <Link href="/giveaway">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back
        </Link>
      </Button>
      <div className="relative my-[150px] flex justify-center">
        {address && renderCards()}
      </div>
    </div>
  )
}

export default NFTPage
