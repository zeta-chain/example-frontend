"use client"

import { useContext } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Settings } from "lucide-react"

import { NavItem } from "@/types/nav"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import Transactions from "@/components/transactions"
import { AppContext } from "@/app/index"

export function MainNav() {
  const pathname = usePathname()
  const { cctxs } = useContext(AppContext)

  const inProgress =
    cctxs.filter(
      (cctx: any) =>
        cctx.status !== "mined-success" && cctx.status !== "mined-fail"
    ).length > 0

  return (
    <div className="flex gap-6 md:gap-10">
      <NavigationMenu>
        <NavigationMenuList className="flex-row gap-1">
          <NavigationMenuItem>
            <Link href="/" legacyBehavior passHref>
              <NavigationMenuLink
                className={cn(
                  navigationMenuTriggerStyle(),
                  pathname === "/" ? "bg-accent" : ""
                )}
              >
                <Home className="mr-1 h-4 w-4" />
                Home
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings
                    className={cn("h-4 w-4", inProgress && "animate-spin")}
                  />
                </Button>
              </SheetTrigger>
              <SheetContent className="flex w-full max-w-full border-none bg-transparent shadow-none sm:w-[500px] sm:max-w-full">
                <div className="height-100 w-full overflow-y-scroll rounded-lg bg-white p-7 shadow-xl">
                  <SheetHeader>
                    <SheetDescription></SheetDescription>
                  </SheetHeader>
                  <h1 className="mb-4 mt-6 text-2xl font-extrabold leading-tight tracking-tight">
                    Transactions
                  </h1>
                  <Transactions />
                </div>
              </SheetContent>
            </Sheet>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}
