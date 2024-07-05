export interface TokenSelected {
  balance: string
  coin_type: string
  contract: string
  zrc20: string
  chain_id: number
  symbol: string
  decimals: number
}

export interface DestinationTokenSelected {
  chain_name: string
  chain_id: string
  coin_type: string
  contract: string
  zrc20: string
}

export interface CrossChainFee {
  amount: string
  decimals: number
  symbol: string
  formatted: string
}

export interface Balance {
  id: string
  contract: string
}
