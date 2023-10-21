import { trackCCTX } from "@zetachain/toolkit/helpers";
import EventEmitter from "eventemitter3";
import {
  Card,
  Box,
  Spacer,
  Text,
  CardHeader,
  CardBody,
  CardFooter,
} from "@chakra-ui/react";
import { CheckIcon, WarningTwoIcon } from "@chakra-ui/icons";
import { Spinner, Flex } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";

export const TrackCCTX = ({ value }: any) => {
  const { inboundHash, desc } = value;
  const [status, setStatus] = useState("searching");

  useEffect(() => {
    const emitter = new EventEmitter();

    emitter
      .on("search-add", () => setStatus("searching"))
      // .on("search-end", () => setStatus("idle"))
      // .on("add", () => setStatus("adding"))
      .on("succeed", () => setStatus("success"))
      .on("fail", () => setStatus("failure"));
    // .on("update", () => setStatus("updating"));

    const executeTracking = async () => {
      try {
        await trackCCTX(inboundHash, false, emitter);
      } catch (e) {}
    };

    executeTracking();

    return () => {
      emitter.removeAllListeners();
    };
  }, []);

  return (
    <Card mb="2" variant="outline">
      <CardBody>
        <Flex>
          <Flex alignItems="center" flexDirection="row">
            {status === "success" && <CheckIcon boxSize="4" color="green" />}
            {status === "failure" && <WarningTwoIcon boxSize="4" color="red" />}
            {status === "searching" && <Spinner size="sm" color="gray.400" />}
          </Flex>
          <Text ml="4">{desc}</Text>
        </Flex>
      </CardBody>
    </Card>
  );
};
