export interface TokenSelected {
  balance: string
  coin_type: string
  contract: string
  zrc20: string
  symbol: string
}

export interface DestinationTokenSelected {
  chain_name: string
  chain_id: string
  coin_type: string
  contract: string
  zrc20: string
}

export interface CrossChainFee {
  amount: string | number
  decimals: number
  symbol: string
  formatted: string
}
