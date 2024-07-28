"use client"

import React, { useState } from "react"
import { isUndefined } from "lodash"
import Wallet, { AddressPurpose } from "sats-connect"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { createTransaction, signPsbt } from "./xverse-utils"

type Wallet = "XDefi" | "UniSat" | "XVerse"

interface ConnectedAddressData {
  address: string
  pubKey: string
}

export type Params = {
  contract: string
  message: string
  amount: number
  tss: string
}

declare global {
  interface Window {
    unisat: any
  }
}

const BtcIntegration = () => {
  const [contractAddress, setContractAddress] = useState("")
  const [message, setMessage] = useState("")
  const [amount, setAmount] = useState<number | undefined>()
  const [selectedWallet, setSelectedWallet] = useState<Wallet>("XDefi")

  const sendTransaction = async () => {
    const tss = "tb1qy9pqmk2pd9sv63g27jt8r657wy0d9ueeh0nqur"
    if (contractAddress.length !== 42)
      return alert("Not a valid contract address")
    if (isUndefined(amount) || isNaN(amount))
      return alert("Amount must be a number")

    const params = {
      contract: contractAddress.slice(2),
      message: message.slice(2),
      amount,
      tss,
    }

    switch (selectedWallet) {
      case "XDefi":
        await callXDefi(params)
        break
      case "UniSat":
        await callUniSat(params)
        break
      case "XVerse":
        await callXverse(params)
        break
    }
  }

  const callXDefi = async (params: Params) => {
    if (!window.xfi) return alert("XDEFI wallet not installed")
    const wallet = window.xfi
    window.xfi.bitcoin.changeNetwork("testnet")
    const account = (await wallet?.bitcoin?.getAccounts())?.[0]
    if (!account) return alert("No account found")
    const tx = {
      method: "transfer",
      params: [
        {
          feeRate: 10,
          from: account,
          recipient: params.tss,
          amount: {
            amount: params.amount,
            decimals: 8,
          },
          memo: `hex::${params.contract}${params.message}`,
        },
      ],
    }
    window.xfi.bitcoin.request(tx, (err: Error, res: Response) => {
      if (err) {
        return alert(`Couldn't send transaction, ${JSON.stringify(err)}`)
      } else if (res) {
        return alert(`Broadcasted a transaction, ${JSON.stringify(res)}`)
      }
    })
  }

  const callUniSat = async (params: Params) => {
    if (!window.unisat) return alert("Unisat wallet not installed")
    try {
      await window.unisat.requestAccounts()
      const memos = [`${params.contract}${params.message}`.toLowerCase()]
      const tx = await window.unisat.sendBitcoin(params.tss, params.amount, {
        memos,
      })
      return alert(`Broadcasted a transaction: ${JSON.stringify(tx)}`)
    } catch (e) {
      return alert(`Couldn't send transaction, ${JSON.stringify(e)}`)
    }
  }

  const callXverse = async (params: Params) => {
    const response = await Wallet.request("getAccounts", {
      purposes: [AddressPurpose.Payment],
      message: "Test app wants to know your addresses!",
    })

    if (response.status == "success") {
      const result = await createTransaction(
        response.result[0].publicKey,
        response.result[0].address,
        params
      )

      await signPsbt(result.psbtB64, result.utxoCnt, response.result[0].address)
    } else {
      alert("wallet connection failed")
    }
  }

  return (
    <div className="grid sm:grid-cols-3 gap-x-10 mt-12">
      <div className="sm:col-span-2 overflow-x-auto">
        <div className="flex items-center justify-start gap-2 mb-6">
          <h1 className="leading-10 text-2xl font-bold tracking-tight pl-4">
            BTC Integration
          </h1>
        </div>
        <div className="pl-10 px-3 flex flex-col gap-6">
          <div>
            <Label>Amount in satoshis</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(Number(e.target.value))
              }}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Omnichain contract address</Label>
            <Input
              type="text"
              value={contractAddress}
              onChange={(e) => {
                setContractAddress(e.target.value)
              }}
              placeholder="0xc79EA..."
            />
          </div>
          <div>
            <Label>Contract call parameters</Label>
            <Input
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
              }}
              placeholder="0x3724C..."
            />
          </div>

          <div>
            <select
              onChange={(e) => {
                setSelectedWallet(e.target.value as Wallet)
              }}
              className="block my-2"
            >
              <option value="XDefi">XDEFI</option>
              <option value="UniSat">Unisat</option>
              <option value="XVerse">Xverse</option>
            </select>
            <Button
              size="sm"
              className="mt-4"
              onClick={() => {
                sendTransaction()
              }}
            >
              Send transaction
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BtcIntegration
