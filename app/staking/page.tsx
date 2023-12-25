"use client"

import { useContext, useEffect, useState } from "react"
import Link from "next/link"
import { hashMessage } from "@ethersproject/hash"
import { computePublicKey, recoverPublicKey } from "@ethersproject/signing-key"
import { generatePostBodyBroadcast } from "@evmos/provider"
import {
  MsgDelegateParams,
  createTxMsgDelegate,
  createTxRawEIP712,
  signatureToWeb3Extension,
} from "@evmos/transactions"
import { signatureToPubkey } from "@hanchon/signature-to-pubkey"
import { getEndpoints } from "@zetachain/networks/dist/src/getEndpoints"
import { set } from "lodash"
import { Globe2 } from "lucide-react"
import { parseUnits } from "viem"
import { useAccount } from "wagmi"

import { useEthersSigner } from "@/lib/ethers"
import { hexToBech32Address } from "@/lib/hexToBech32Address"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { AppContext } from "@/app/index"

const StakingPage = () => {
  const {
    validators,
    fetchValidators,
    fetchStakingDelegations,
    stakingDelegations,
    balances,
  } = useContext(AppContext)
  const [selectedValidator, setSelectedValidator] = useState<any>(null)
  const [isSending, setIsSending] = useState(false)
  const [amount, setAmount] = useState<any>("")
  const { address } = useAccount()
  const { toast } = useToast()

  useEffect(() => {
    fetchStakingDelegations()
    fetchValidators()
  }, [])

  const findBalance = (chainId: number, coinType: string) => {
    const balance = balances.find(
      (b: any) => b.chain_id === chainId && b.coin_type === coinType
    )
    return balance ? balance.balance : "0"
  }

  const zetaBalance = findBalance(7001, "Gas")

  const handleSelectValidator = (validator: any) => {
    setSelectedValidator(validator)
  }

  const delegatedValidatorAddresses = new Set(
    stakingDelegations.map((d: any) => d.delegation.validator_address)
  )

  const sortedValidators = validators.sort((a: any, b: any) => {
    const aIsDelegated = delegatedValidatorAddresses.has(a.operator_address)
    const bIsDelegated = delegatedValidatorAddresses.has(b.operator_address)
    const aIsJailed = a.jailed
    const bIsJailed = b.jailed

    // Prioritize validators with user delegations first
    if (aIsDelegated && !bIsDelegated) return -1
    if (!aIsDelegated && bIsDelegated) return 1

    // Then sort by jailed status (non-jailed first)
    if (aIsJailed && !bIsJailed) return 1
    if (!aIsJailed && bIsJailed) return -1

    // Finally, sort by voting power
    return b.voting_power - a.voting_power
  })

  const getStakedAmount = (validatorAddress: string) => {
    const delegation = stakingDelegations.find(
      (d: any) => d.delegation.validator_address === validatorAddress
    )
    return delegation ? delegation.balance.amount : null
  }

  const handleStake = async () => {
    setIsSending(true)
    let result: any = null
    try {
      const api = getEndpoints("cosmos-http", "zeta_testnet")[0]?.url
      const accountAddress = hexToBech32Address(address as any, "zeta")
      const url = `${api}/cosmos/auth/v1beta1/accounts/${accountAddress}`
      const broadcastURL = `${api}/cosmos/tx/v1beta1/txs`
      const { account } = await (await fetch(url))?.json()
      const { sequence, account_number } = account?.base_account
      const pubkey = account?.base_account.pub_key.key
      const chain = { chainId: 7001, cosmosChainId: "athens_7001-1" }
      const sender = {
        accountAddress,
        sequence,
        accountNumber: account_number,
        pubkey,
      }
      const fee = {
        amount: "4000000000000000",
        denom: "azeta",
        gas: "200000",
      }
      const memo = ""
      const params = {
        validatorAddress: selectedValidator.operator_address,
        amount: parseUnits(amount, 18).toString(),
        denom: "azeta",
      }
      const tx = createTxMsgDelegate(chain, sender, fee, memo, params)
      if (address) {
        const signature = await window?.ethereum?.request({
          method: "eth_signTypedData_v4",
          params: [address, JSON.stringify(tx.eipToSign)],
        })

        const extension = signatureToWeb3Extension(
          chain,
          sender,
          signature as any
        )

        const rawTx = createTxRawEIP712(
          tx.legacyAmino.body,
          tx.legacyAmino.authInfo,
          extension
        )
        const post = await fetch(broadcastURL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: generatePostBodyBroadcast({
            message: {
              toBinary() {
                return rawTx.message.serializeBinary()
              },
            },
            path: rawTx.path,
          }),
        })
        result = await post.json()
      }
    } catch (e) {
      console.error(e)
    } finally {
      const title = result?.tx_response.code === 0 ? "Success" : "Error"
      const description =
        result?.tx_response.code === 0 ? "All good." : result.raw_log
      console.log(result)
      setIsSending(false)
      setAmount("")
      toast({ title, description })
    }
  }

  const ValidatorTable = () => {
    return (
      <Table>
        <TableHeader>
          <TableRow className="border-none hover:bg-transparent">
            <TableHead>Validator</TableHead>
            <TableHead className="text-right">Staked</TableHead>
            <TableHead className="text-right">Voting&nbsp;power</TableHead>
            <TableHead className="text-right">Commission</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedValidators.map((v: any) => {
            const stakedAmount = getStakedAmount(v.operator_address)
            return (
              <TableRow
                key={v.operator_address}
                className={`border-none cursor-pointer ${
                  v.jailed ? "text-gray-300" : ""
                }`}
                onClick={() => handleSelectValidator(v)}
              >
                <TableCell className="pl-4 rounded-bl-xl rounded-tl-xl">
                  {v.description.moniker}
                </TableCell>
                <TableCell className="text-right">
                  {stakedAmount &&
                    `${(parseFloat(stakedAmount) / 1e18).toFixed(2)}`}
                </TableCell>
                <TableCell className="text-right">
                  <span>{parseFloat(v.voting_power).toFixed(2)}</span>%
                </TableCell>
                <TableCell className="rounded-br-xl rounded-tr-xl text-right">
                  <span>
                    {(
                      parseFloat(v.commission.commission_rates.rate) * 100
                    ).toFixed(0)}
                  </span>
                  %
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="grid sm:grid-cols-3 gap-x-10 mt-12">
      <div className="sm:col-span-2 overflow-x-scroll">
        <h1 className="leading-10 text-2xl font-bold tracking-tight pl-4 mb-6">
          Staking
        </h1>
        <div className="pl-4 text-sm text-muted-foreground mb-1">Available</div>
        <div className="pl-4 text-3xl font-bold mb-10">
          {parseFloat(zetaBalance).toFixed(2)} ZETA
        </div>
        <div>
          {validators.length > 0 ? (
            <ValidatorTable />
          ) : (
            <div className="pl-4">Loading...</div>
          )}
        </div>
      </div>
      <div className="sm:col-span-1 relative order-first sm:order-last">
        {selectedValidator && (
          <div className="sticky top-20 shadow-none md:shadow-xl p-0 md:px-4 md:py-7 rounded-2xl md:shadow-gray-100 mb-10">
            <h1 className="text-2xl font-bold leading-tight tracking-tight mt-6 mb-4 ml-3">
              {selectedValidator?.description.moniker}
            </h1>
            <div className="ml-3 mb-2">
              {selectedValidator?.description.details}
            </div>
            {selectedValidator?.description.website && (
              <div>
                <Button variant="link" asChild>
                  <Link
                    href={selectedValidator?.description.website}
                    target="_blank"
                  >
                    <Globe2 className="w-4 h-4 mr-1" />
                    {selectedValidator?.description.website
                      .replace(/^(https?:\/\/)/, "")
                      .replace(/\/$/, "")}
                  </Link>
                </Button>
              </div>
            )}
            <div className="mx-3 mt-4 grid gap-4 grid-cols-3">
              <div className="col-span-2">
                <Input
                  placeholder="0"
                  value={amount}
                  className="text-xl mb-1"
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div className="text-xs text-slate-400">
                  Available: {parseFloat(zetaBalance).toFixed(4)} ZETA
                </div>
              </div>
              <Button
                disabled={isSending}
                className="w-full col-span-1"
                onClick={handleStake}
              >
                Stake
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StakingPage
