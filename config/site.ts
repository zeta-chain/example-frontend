export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "Next.js",
  description:
    "Beautifully designed components built with Radix UI and Tailwind CSS.",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Balances",
      href: "/balances",
    },
    {
      title: "Messaging",
      href: "/messaging",
    },
    {
      title: "Token Transfer",
      href: "/transfer",
    },
    {
      title: "Transactions",
      href: "/transactions",
    },
    {
      title: "Fees",
      href: "/fees",
    },
  ],
}
