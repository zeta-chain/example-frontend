# ZetaChain Frontend App Template

This repository provides a frontend app template for developers looking to build
applications on ZetaChain. It's designed to demonstrate various ZetaChain
functionalities and serve as a starting point for custom DApp development.

![Screenshot](./public/screenshot.png)

The template is built with [Next.js](https://nextjs.org/),
[Tailwind](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), and
the [ZetaChain Toolkit](https://github.com/zeta-chain/toolkit/).

## Features

- Portfolio view with token balances
- Omnichain swaps
- Token deposit and withdrawal
- Cross-chain transaction tracking
- Cross-chain messaging example
- Bitcoin support

## Prerequisites

- Node.js v18
- Yarn

The ZetaChain Toolkit is initialized with a custom RPC endpoint for ZetaChain to
ensure that requests are not rate-limited. By default we're using an RPC endpoint
provided by [AllThatNode](https://www.allthatnode.com/zetachain.dsrv).

Before starting the development server:

- Sign up for a free tier account at [AllThatNode](https://www.allthatnode.com/)
  and copy the API key from the dashboard into a `.env.local` file as a
  `NEXT_PUBLIC_ATN_API_KEY` variable.
- Or replace the RPC in `ZetaChainContext.tsx` with the endpoint of your choice.

## Getting Started

Start a development server:

```
yarn dev
```

## Contributions

Contributions are welcome. Please fork the project, create your feature branch,
commit your changes, push to the branch, and open a pull request.

## Disclaimer

This is an early stage project. Expect bugs, breaking changes, and unfinished
features. Please use at your own risk.
