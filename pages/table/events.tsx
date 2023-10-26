import Image from "next/image";
import { Inter } from "next/font/google";
import Head from "next/head";
import { useState, useEffect } from "react";
import { type } from "os";
import Web3 from "web3";
import { contractAbi } from "@/constants/contractABI";

const inter = Inter({ subsets: ["latin"] });

const providerUrl =
  "https://base.blockpi.network/v1/rpc/8bfe5dae92f901117832b75d348793bda33fe2a5";

type Event = {
  timestamp: string;
  buyer: string;
  channelId: string;
  transactionType: string;
  ethAmount: string;
  shareQuantity: string;
  transactionHash: string;
};

const dummyEvents: Event[] = [
  {
    timestamp: "2021-10-01 12:00:00",
    buyer: "0x1234",
    channelId: "001",
    ethAmount: "0.1",
    shareQuantity: "2",
    transactionType: "Buy",
    transactionHash: "0x1234",
  },
  {
    timestamp: "2021-10-01 12:00:00",
    buyer: "0x567",
    channelId: "002",
    ethAmount: "0.5",
    shareQuantity: "1",
    transactionType: "Sell",
    transactionHash: "0x567",
  },
];

const fetchTrades = async (
  contract: any,
  fromBlock: string,
  toBlock: string,
  web3: Web3 = new Web3(providerUrl)
): Promise<Event[]> => {
  console.log(`fetching trades from ${fromBlock} to ${toBlock}`);

  let rawEvents: any[] = [];

  try {
    rawEvents = await (contract as any).getPastEvents("Trade", {
      fromBlock: fromBlock,
      toBlock: "latest",
    });
  } catch (error) {
    console.error("Error fetching raw events:", error);
  }

  if (rawEvents.length === 0) {
    return [];
  }
  const newEvents = await Promise.all(
    rawEvents.map(async (event: any) => {
      try {
        const { returnValues, blockNumber, transactionHash } = event;
        const blockDetails = await web3.eth.getBlock(blockNumber);

        if (!blockDetails || !blockDetails.timestamp) {
          console.warn("blockDetails or timestamp is missing");
          return null; // Returning null here, to filter out later
        }
        const timestamp = new Date(
          Number(blockDetails.timestamp) * 1000
        ).toLocaleTimeString();

        let ethAmountString = returnValues.ethAmount.toString(); // Convert BigInt to string
        let ethAmountNumber = parseFloat(ethAmountString); // Convert to Number for further calculations
        let ethAbs = Math.abs(parseFloat((ethAmountNumber / 1e18).toFixed(7)));

        return {
          buyer: returnValues.trader,
          channelId: returnValues.channelId.toString(),
          transactionType: returnValues.isBuy ? "Buy" : "Sell",
          shareQuantity: returnValues.shareAmount.toString(),
          ethAmount: ethAbs.toString(),
          timestamp,
          transactionHash,
        };
      } catch (error) {
        console.error("Error in Promise.all map:", error);
        return null; // Return null in case of errors
      }
    })
  );
  const newTradeEvents: Event[] = newEvents.filter(
    (event): event is Event => event !== null
  );
  return newTradeEvents;
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);

  const [currentBlock, setCurrentBlock] = useState<bigint | null>(null);
  const [lastBlockFetched, setLastBlockFetched] = useState<bigint | null>(null);

  useEffect(() => {
    const web3 = new Web3(providerUrl);
    const contractAddress = "0xbc98176dc471cb67dc19fa4558104f034d8965fa";
    const contract = new web3.eth.Contract(contractAbi, contractAddress);

    const fetchAndSetBlocks = async () => {
      const latestBlock = await web3.eth.getBlockNumber();
      if (lastBlockFetched === null) {
        setLastBlockFetched(latestBlock - BigInt(50));
      } else {
        setLastBlockFetched(currentBlock);
      }
      setCurrentBlock(latestBlock);
    };

    // Moved fetchTrades call inside setInterval
    const pollInterval = 10000;
    const poll = setInterval(() => {
      // Fetch the blocks
      fetchAndSetBlocks();
    }, pollInterval);

    // Initial fetch
    fetchAndSetBlocks().then(() => {
      if (currentBlock !== null) {
        if (lastBlockFetched === null) {
          return;
        }
        const fromBlock = lastBlockFetched + BigInt(1);
        const fromBlockHex = web3.utils.toHex(fromBlock);
        const toBlock = web3.utils.toHex(currentBlock);
        console.log(`fromBLock: ${fromBlock}`)
        console.log(`currentBlock: ${currentBlock}`)
        fetchTrades(contract, fromBlockHex, toBlock).then((newEvents) => {
          setEvents((prevEvents) => [...newEvents, ...prevEvents]);
        });
      }
    });

    return () => {
      clearInterval(poll);
    };
  }, [currentBlock]);

  return (
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      {/* Table Header */}
      <thead className="bg-gray-50 dark:bg-gray-800">
        <tr>
          <th
            scope="col"
            className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
          >
            Timestamp
          </th>
          <th
            scope="col"
            className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
          >
            Buyer
          </th>
          <th
            scope="col"
            className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
          >
            Room ID
          </th>
          <th
            scope="col"
            className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
          >
            Cost
          </th>
          <th
            scope="col"
            className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
          >
            Quantity
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-900">
        {events.map((event, index) => (
          <tr
            key={index}
            // If transactionType is "Buy", use bg-green-500, otherwise use bg-red-500
            className={
              event.transactionType === "Buy" ? "bg-green-500" : "bg-red-500"
            }
          >
            <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
              {event.timestamp}
            </td>
            <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
              {event.buyer}
            </td>
            <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
              {event.channelId}
            </td>
            <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
              {event.ethAmount}
            </td>
            <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
              {event.shareQuantity}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
