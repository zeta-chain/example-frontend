import { useContext } from "react";
import AppContext from "./AppContext";
import { TrackCCTX } from "./TrackCCTX";
import { Heading } from "@chakra-ui/react";

export const Transactions = () => {
  const { cctxs } = useContext(AppContext);

  return (
    <div>
      <Heading size="sm" mb="5">
        Transactions
      </Heading>
      {cctxs.map((cctx: any, index: any) => (
        <div key={index}>
          <TrackCCTX value={cctx} />
        </div>
      ))}
    </div>
  );
};
