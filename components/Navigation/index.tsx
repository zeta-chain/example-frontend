"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCCTXsContext } from "@/context/CCTXsContext"
import { Home, Settings } from "lucide-react"

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
  SheetTrigger,
} from "@/components/ui/sheet"
import Transactions from "@/components/Transactions"

export function MainNav() {
  const pathname = usePathname()
  const { cctxs } = useCCTXsContext()

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
                className={`${navigationMenuTriggerStyle()} ${
                  pathname === "/" ? "bg-accent" : ""
                }`}
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
                    className={`h-4 w-4 ${inProgress && "animate-spin"}`}
                  />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-transparent w-full max-w-full sm:w-[500px] sm:max-w-full border-none shadow-none flex">
                <div className="p-7 bg-white rounded-lg shadow-xl height-100 w-full overflow-y-scroll">
                  <SheetHeader>
                    <SheetDescription></SheetDescription>
                  </SheetHeader>
                  <h1 className="text-2xl font-extrabold leading-tight tracking-tight mt-6 mb-4">
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
