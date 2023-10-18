import { Input, Button, Select } from "@chakra-ui/react";
import * as React from "react";
import { useDebounce } from "use-debounce";
import {
  usePrepareContractWrite,
  useWaitForTransaction,
  useContractWrite,
  useNetwork,
} from "wagmi";
import networks from "@zetachain/networks/dist/src/networks";
import { getNetworkName } from "@zetachain/networks/dist/src/getNetworkName";

const contracts: any = {
  goerli_testnet: "0x122F9Cca5121F23b74333D5FBd0c5D9B413bc002",
  mumbai_testnet: "0x392bBEC0537D48640306D36525C64442E98FA780",
  bsc_testnet: "0xc5d7437DE3A8b18f6380f3B8884532206272D599",
};

export const Messaging = () => {
  const [message, setMessage] = React.useState("");
  const [debouncedMessage] = useDebounce(message, 500);

  const allNetworks = Object.keys(contracts);

  const [destinationNetwork, setDestinationNetwork] = React.useState("");

  const [destinationChainID, setDestinationChainID] = React.useState(null);

  const { chain } = useNetwork();
  const currentNetworkName = chain ? getNetworkName(chain.network) : undefined;

  React.useEffect(() => {
    setDestinationChainID(
      (networks as any)[destinationNetwork]?.chain_id ?? null
    );
  }, [destinationNetwork]);

  const {
    config,
    error: prepareError,
    isError: isPrepareError,
  } = usePrepareContractWrite({
    address: contracts[destinationNetwork || ""],
    abi: [
      {
        inputs: [
          {
            internalType: "uint256",
            name: "destinationChainId",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "message",
            type: "string",
          },
        ],
        name: "sendMessage",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
    ],
    value: BigInt("10000000000000000"),
    functionName: "sendMessage",
    args: [
      BigInt(destinationChainID !== null ? destinationChainID : 0),
      debouncedMessage,
    ],
  });

  const { data, write } = useContractWrite(config);

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  const availableNetworks = allNetworks.filter(
    (network) => network !== currentNetworkName
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        write?.();
      }}
    >
      <Input
        mb={4}
        value={`Source network: ${
          currentNetworkName || "unknown (please, connect wallet)"
        }`}
        isDisabled
        aria-label="Source Network"
        placeholder="Source network"
        readOnly
      />
      <Select
        mb={4}
        value={destinationNetwork}
        onChange={(e) => setDestinationNetwork(e.target.value)}
        isDisabled={!currentNetworkName}
        placeholder="Select destination network"
      >
        {availableNetworks.map((network) => (
          <option key={network} value={network}>
            {network}
          </option>
        ))}
      </Select>
      <Input
        mb={4}
        aria-label="Message"
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message"
        isDisabled={!currentNetworkName}
        value={message}
      />
      <Button
        type="submit"
        isDisabled={isLoading || !write || !message || !currentNetworkName}
      >
        {isLoading ? "Sending..." : "Send"}
      </Button>
      {isSuccess && <div>Successfully sent message</div>}
    </form>
  );
};
