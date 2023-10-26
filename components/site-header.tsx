import Link from "next/link"
import {
  ConnectButton,
  RainbowKitProvider,
  getDefaultWallets,
} from "@rainbow-me/rainbowkit"

import { siteConfig } from "@/config/site"
import { buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { MainNav } from "@/components/main-nav"
import { ThemeToggle } from "@/components/theme-toggle"

export function SiteHeader() {
  return (
    <header className="bg-background sticky top-0 z-40 w-full">
      <div className="container px-4 flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            <ConnectButton
              accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
            />
          </nav>
        </div>
      </div>
    </header>
  )
}
