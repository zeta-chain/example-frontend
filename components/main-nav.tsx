import * as React from "react"
import Link from "next/link"

import { NavItem } from "@/types/nav"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Icons } from "@/components/icons"

interface MainNavProps {
  items?: NavItem[]
}

export function MainNav({ items }: MainNavProps) {
  return (
    <div className="flex gap-6 md:gap-10">
      <NavigationMenu>
        <NavigationMenuList className="flex-row gap-1">
          <NavigationMenuItem>
            <NavigationMenuTrigger>Examples</NavigationMenuTrigger>
            <NavigationMenuContent className="grid w-[300px] gap-3 p-4 md:w-[450px] md:grid-cols-2 lg:w-[500px]">
              <Link href="/messaging" legacyBehavior passHref>
                <NavigationMenuLink className="text-sm block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                  Messaging
                </NavigationMenuLink>
              </Link>
              <Link href="/omnichain" legacyBehavior passHref>
                <NavigationMenuLink className="text-sm block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                  Omnichain
                </NavigationMenuLink>
              </Link>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Tools</NavigationMenuTrigger>
            <NavigationMenuContent className="grid w-[300px] gap-3 p-4 md:w-[450px] md:grid-cols-2 lg:w-[500px]">
              <Link href="/balances" legacyBehavior passHref>
                <NavigationMenuLink className="text-sm block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                  Balances
                </NavigationMenuLink>
              </Link>
              <Link href="/transfer" legacyBehavior passHref>
                <NavigationMenuLink className="text-sm block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                  Token Transfer
                </NavigationMenuLink>
              </Link>
              <Link href="/transactions" legacyBehavior passHref>
                <NavigationMenuLink className="text-sm block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                  Transactions
                </NavigationMenuLink>
              </Link>
              <Link href="/fees" legacyBehavior passHref>
                <NavigationMenuLink className="text-sm block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                  Fees
                </NavigationMenuLink>
              </Link>
            </NavigationMenuContent>
          </NavigationMenuItem>
          {/* <NavigationMenuItem>
            <Link href="/" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Examples
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem> */}
          {/* <NavigationMenuItem>
            <Link href="/balances" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Tools
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem> */}
          {/* <NavigationMenuItem>
            <Link href="/messaging" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Messaging
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/transfer" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Token Transfer
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/transactions" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Transactions
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/fees" legacyBehavior passHref className="grow">
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Fees
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem> */}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}
