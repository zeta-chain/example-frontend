import {
  ChakraProvider,
  Tabs,
  TabList,
  TabPanels,
  Flex,
  Spacer,
  Tab,
  TabPanel,
  Container,
  theme,
} from "@chakra-ui/react";
import "@rainbow-me/rainbowkit/styles.css";
import { Messaging } from "./Messaging";
import { Balances } from "./Balances";
import { Fees } from "./Fees";
import "@rainbow-me/rainbowkit/styles.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig, useAccount } from "wagmi";
import {
  bscTestnet,
  goerli,
  polygonMumbai,
  zetachainAthensTestnet,
} from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    goerli,
    polygonMumbai,
    {
      ...zetachainAthensTestnet,
      iconUrl: "https://www.zetachain.com/favicon/favicon.png",
    },
    bscTestnet,
  ],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "RainbowKit App",
  projectId: "YOUR_PROJECT_ID",
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>
          <Tabs variant="soft-rounded" m="4" mt="0" colorScheme={"gray"}>
            <Flex flexWrap="wrap-reverse" alignItems="center">
              <TabList>
                <Flex flexWrap="wrap" alignContent="center">
                  <Tab>Messaging</Tab>
                  <Tab>Balances</Tab>
                  <Tab>Fees</Tab>
                </Flex>
              </TabList>
              <Spacer />
              <Flex alignItems="center" mb="4" mt="4">
                <ConnectButton />
              </Flex>
            </Flex>
            <Container mt="4" p="0">
              <TabPanels>
                <TabPanel>
                  <Messaging />
                </TabPanel>
                <TabPanel>
                  <Balances />
                </TabPanel>
                <TabPanel>
                  <Fees />
                </TabPanel>
              </TabPanels>
            </Container>
          </Tabs>
        </RainbowKitProvider>
      </WagmiConfig>
    </ChakraProvider>
  );
};
