import { useState, useEffect } from "react";
import { fetchFees } from "@zetachain/toolkit/helpers";
import { useAccount } from "wagmi";
import {
  TableContainer,
  Table,
  TableCaption,
  Thead,
  Tbody,
  Tr,
  Th,
  Heading,
  Td,
} from "@chakra-ui/react";

export const Fees = () => {
  const [fees, setFees] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();

  useEffect(() => {
    const fetchFee = async () => {
      setIsLoading(true);
      try {
        const result = await fetchFees(500000);
        setFees(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
      setIsLoading(false);
    };
    fetchFee();
  }, [address]);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Heading size="sm">
        Omnichain fees (in native gas tokens of destination chain):
      </Heading>
      <TableContainer>
        <Table variant="simple" mt="5" mb="10">
          <Thead>
            <Tr>
              <Th>Network</Th>
              <Th>Total Fee</Th>
              <Th>Gas Fee</Th>
              <Th>Protocol Fee</Th>
            </Tr>
          </Thead>
          <Tbody>
            {fees?.feesZEVM &&
              Object.entries(fees.feesZEVM).map(
                ([network, feeDetails]: [string, any]) => (
                  <Tr key={`omnichain-${network}`}>
                    <Td>{network}</Td>
                    <Td>{feeDetails.totalFee}</Td>
                    <Td>{feeDetails.gasFee}</Td>
                    <Td>{feeDetails.protocolFee}</Td>
                  </Tr>
                )
              )}
          </Tbody>
        </Table>
      </TableContainer>

      <Heading size="sm">
        Cross-chain messaging fees (in ZETA, gas limit: 500000):
      </Heading>
      <TableContainer mt="5" mb="10">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Network</Th>
              <Th>Total Fee</Th>
              <Th>Gas Fee</Th>
              <Th>Protocol Fee</Th>
            </Tr>
          </Thead>
          <Tbody>
            {fees?.feesCCM &&
              Object.entries(fees.feesCCM).map(
                ([network, feeDetails]: [string, any]) => (
                  <Tr key={`ccm-${network}`}>
                    <Td>{network}</Td>
                    <Td>{feeDetails.totalFee}</Td>
                    <Td>{feeDetails.gasFee}</Td>
                    <Td>{feeDetails.protocolFee}</Td>
                  </Tr>
                )
              )}
          </Tbody>
        </Table>
      </TableContainer>
    </div>
  );
};
