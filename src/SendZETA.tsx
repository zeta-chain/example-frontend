import { Input, Select, Button, Heading } from "@chakra-ui/react";
import React, { useContext } from "react";
import { useNetwork, useAccount } from "wagmi";
import { getNetworkName } from "@zetachain/networks/dist/src/getNetworkName";
import { sendZETA } from "@zetachain/toolkit/helpers";
import { useEthersSigner } from "./ethers";
import AppContext from "./AppContext";

export const SendZETA = () => {
  const networks = [
    "goerli_testnet",
    "mumbai_testnet",
    "bsc_testnet",
    "zeta_testnet",
  ];

  const { cctxs, setCCTXs } = useContext(AppContext);

  const { address, isConnected } = useAccount();
  const [destinationNetwork, setDestinationNetwork] = React.useState("");

  const [amount, setAmount] = React.useState("");
  const [recipient, setRecipient] = React.useState("");

  React.useEffect(() => {
    setRecipient(address || "");
  }, [address]);

  const { chain } = useNetwork();
  const signer = useEthersSigner();

  const currentNetworkName = chain ? getNetworkName(chain.network) : undefined;

  const [isSending, setIsSending] = React.useState(false);

  const handleSend = async () => {
    setIsSending(true);

    if (!currentNetworkName) {
      setIsSending(false);
      throw new Error("Current network is not defined.");
    }

    if (!address) {
      setIsSending(false);
      throw new Error("Address undefined.");
    }

    if (signer && destinationNetwork && amount) {
      try {
        const tx = await sendZETA(
          signer,
          amount,
          currentNetworkName,
          destinationNetwork,
          address
        );
        const cctx = {
          inboundHash: tx.hash,
          desc: `Sent ${amount} ZETA to ${recipient} on ${destinationNetwork}`,
        };
        setCCTXs([cctx, ...cctxs]);
      } catch (error) {
        console.error("Error sending ZETA:", error);
      } finally {
        setIsSending(false);
      }
    }
  };

  return (
    <div>
      <Heading size="sm" mb="5">
        Send ZETA
      </Heading>
      <Select
        mb="4"
        value={destinationNetwork}
        onChange={(e) => setDestinationNetwork(e.target.value)}
        isDisabled={!currentNetworkName}
        placeholder="Select destination network"
      >
        {networks
          .filter((network) => network !== currentNetworkName)
          .map((network) => (
            <option key={network} value={network}>
              {network}
            </option>
          ))}
      </Select>
      <Input
        value={recipient}
        placeholder="Recipient address"
        onChange={(e) => setRecipient(e.target.value)}
        mb="4"
      />
      <Input
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount in ZETA"
        type="number"
        mb="4"
      />
      <Button
        isDisabled={!isConnected || !destinationNetwork || !amount || isSending}
        onClick={handleSend}
      >
        Send
      </Button>
    </div>
  );
};
