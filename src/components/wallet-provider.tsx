"use client"

import { FC, ReactNode, useMemo } from "react"
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react"
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { clusterApiUrl } from "@solana/web3.js"

import "@solana/wallet-adapter-react-ui/styles.css"

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const endpoint = clusterApiUrl("devnet") // use 'mainnet-beta' in prod
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new TorusWalletAdapter(), new SolflareWalletAdapter() ], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}