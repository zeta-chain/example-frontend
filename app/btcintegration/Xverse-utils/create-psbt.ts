import { base64, hex } from "@scure/base"
import * as btc from "micro-btc-signer"

const bitcoinTestnet = {
  bech32: "tb",
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  wif: 0xef,
}

async function fetchUtxo(address: string): Promise<any[]> {
  try {
    const response = await fetch(
      `https://mempool.space/testnet/api/address/${address}/utxo`
    )
    if (!response.ok) {
      throw new Error("Failed to fetch UTXO")
    }
    const utxos: any[] = await response.json() // no UTXO => can't do txn
    return utxos
  } catch (error) {
    console.error("Error fetching UTXO:", error)
    throw error
  }
}

export default async function createTransaction(
  publickkey: string,
  senderAddress: string,
  params
) {
  const publicKey = hex.decode(publickkey)

  const p2wpkh = btc.p2wpkh(publicKey, bitcoinTestnet)
  const p2sh = btc.p2sh(p2wpkh, bitcoinTestnet)

  console.log("Public Key:", publicKey)
  console.log("Sender Address:", senderAddress)

  const recipientAddress = "2MsPkF8hBrBiwNyJ9XdYxKLPvfPHNTfpWvn" //change this to tss address tb1qy9pqmk2pd9sv63g27jt8r657wy0d9ueeh0nqur
  if (!senderAddress) {
    throw new Error("Error: no sender address")
  }
  if (!recipientAddress) {
    throw new Error("Error: no recipient address in ENV")
  }

  const output = await fetchUtxo(senderAddress)
  console.log("output:", output)

  const tx = new btc.Transaction({
    allowUnknowOutput: true,
  })

  output.forEach((utxo) => {
    tx.addInput({
      txid: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: p2sh.script,
        amount: BigInt(utxo.value),
      },
      witnessScript: p2sh.witnessScript,
      redeemScript: p2sh.redeemScript,
    })
  })

  const changeAddress = "2N4fbLTRNyuKEhCwo4Pt3mKtWA47YEw6rGU"

  const memo = `${params.contract}${params.message}`.toLowerCase()
  console.log("mem:", memo)
  const opReturn = btc.Script.encode(["RETURN", Buffer.from(memo, "utf8")])

  tx.addOutput({
    script: opReturn,
    amount: BigInt(0),
  })
  tx.addOutputAddress(recipientAddress, BigInt(800), bitcoinTestnet)
  tx.addOutputAddress(changeAddress, BigInt(800), bitcoinTestnet)

  const psbt = tx.toPSBT(0)

  const psbtB64 = base64.encode(psbt)

  console.log("Base64 encoded PSBT:", psbtB64)

  return psbtB64
}
