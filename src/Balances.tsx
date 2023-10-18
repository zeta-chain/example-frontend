import { useState, useEffect } from "react";
import { getBalances } from "@zetachain/toolkit/helpers";
import { useAccount } from "wagmi";
import {
  TableContainer,
  Table,
  Thead,
  Tbody,
  Heading,
  Tr,
  Th,
  Box,
  Td,
} from "@chakra-ui/react";
import { SendZETA } from "./SendZETA";

export const Balances = () => {
  const [balances, setBalances] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { address, isConnected } = useAccount();

  useEffect(() => {
    const fetchBalances = async () => {
      setIsLoading(true);
      try {
        const result = await getBalances(address);
        setBalances(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
      setIsLoading(false);
    };
    fetchBalances();
  }, [address]);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {isConnected && (
        <div>
          <Heading size="sm" mb="5">
            Balances
          </Heading>
          <TableContainer>
            <Table whiteSpace="normal">
              <Thead>
                <Tr>
                  <Th>Network Name</Th>
                  <Th>Native</Th>
                  <Th>ZETA</Th>
                  <Th>ZRC-20</Th>
                </Tr>
              </Thead>
              <Tbody>
                {balances &&
                  balances.map((balance: any, index: any) => (
                    <Tr key={index}>
                      <Td>{balance.networkName}</Td>
                      <Td>{balance.native}</Td>
                      <Td>{balance.zeta || "N/A"}</Td>
                      <Td>{balance.zrc20 || "N/A"}</Td>
                    </Tr>
                  ))}
              </Tbody>
            </Table>
          </TableContainer>
          <Box mt="10">
            <SendZETA />
          </Box>
        </div>
      )}
    </div>
  );
};
