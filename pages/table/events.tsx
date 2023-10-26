import Image from "next/image";
import { Inter } from "next/font/google";
import Head from "next/head";
import { useState, useEffect } from "react";
import { type } from "os";
import Web3 from "web3";
import { contractAbi } from "@/constants/contractABI";
import { Trade, Trader } from "@/types/index";
import {
  fetchTrades,
  fetchRoomCreations,
  fetchTraderInfo,
} from "@/utils/fetch";
import { providerUrl } from "@/constants/provider";

const inter = Inter({ subsets: ["latin"] });

const toBase64 = (str: string) => {
  // Encode the string to Base64
  return btoa(str);
};

export default function Home() {
  const [events, setEvents] = useState<Trade[]>([]);

  const [traders, setTraders] = useState<Record<string, Trader>>({});

  const [currentBlock, setCurrentBlock] = useState<bigint | null>(null);
  const [lastBlockFetched, setLastBlockFetched] = useState<bigint | null>(null);

  const ZAPPER_API_KEY = process.env.NEXT_PUBLIC_ZAPPER_API_KEY || "";

  useEffect(() => {
    const web3 = new Web3(providerUrl);
    const contractAddress = "0xbc98176dc471cb67dc19fa4558104f034d8965fa";
    const contract = new web3.eth.Contract(contractAbi, contractAddress);

    const fetchAndSetBlocks = async () => {
      const latestBlock = await web3.eth.getBlockNumber();
      if (lastBlockFetched === null) {
        setLastBlockFetched(latestBlock - BigInt(20));
      } else {
        setLastBlockFetched(currentBlock);
      }
      setCurrentBlock(latestBlock);
    };

    // Moved fetchTrades call inside setInterval
    const pollInterval = 1000;
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
        console.log(`fromBLock: ${fromBlock}`);
        console.log(`currentBlock: ${currentBlock}`);
        fetchTrades(contract, fromBlockHex, toBlock).then((newEvents) => {
          setEvents((prevEvents) => [...newEvents, ...prevEvents]);
          for (let i = 0; i < newEvents.length; i++) {
            const buyer = newEvents[i].buyer;
            // if the trader is not in the traders object, add them
            if (!traders[buyer]) {
              fetchTraderInfo(buyer, ZAPPER_API_KEY).then((trader) => {
                setTraders((prevTraders) => ({
                  ...prevTraders,
                  [buyer]: trader,
                }));
              });
            }
          }
        });
        fetchRoomCreations(contract, fromBlockHex, toBlock).then(
          (newEvents) => {
            setEvents((prevEvents) => [...newEvents, ...prevEvents]);
            // loop through each new event and print the buyer address
            for (let i = 0; i < newEvents.length; i++) {
              const buyer = newEvents[i].buyer;
              // if the trader is not in the traders object, add them
              if (!traders[buyer]) {
                fetchTraderInfo(buyer, ZAPPER_API_KEY).then((trader) => {
                  setTraders((prevTraders) => ({
                    ...prevTraders,
                    [buyer]: trader,
                  }));
                });
              }
            }
          }
        );
      }
    });

    return () => {
      clearInterval(poll);
    };
  }, [currentBlock]);

  return (
    <div className="flex justify-between">
      {/* <div className="">
        <p>Test</p>
      </div> */}
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
              Trader
            </th>
            <th
              scope="col"
              className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
            >
              Trader Chain-Chat $
            </th>
            <th
              scope="col"
              className="py-3.5 px-4 text-sm font-normal text-left rtl:text-right text-gray-500 dark:text-gray-400"
            >
              Channel ID
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
              // Dynamically set class based on transactionType
              className={
                event.transactionType === "Buy"
                  ? "bg-green-500"
                  : event.transactionType === "Sell"
                  ? "bg-red-500"
                  : event.transactionType === "channelCreation"
                  ? "bg-blue-500"
                  : "bg-gray-200" // Default
              }
            >
              <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                <a
                  href={`https://basescan.org/tx/${event.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-900 text-center rounded-xl w-24 h-8 flex items-center justify-center"
                >
                  {event.timestamp}
                </a>
              </td>
              <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                <a
                  href={`https://zapper.xyz/account/${event.buyer}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-900 text-center rounded-xl w-24 h-8 flex items-center justify-center"
                >
                  {event.buyer.slice(0, 10)}
                </a>
              </td>
              <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                {traders[event.buyer]?.chainChatValue?.split('.')[0] ?? 0}
              </td>
              <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                {/* Encode channelId to Base64 */}
                {(() => {
                  const formattedChannelId = `ChatChannel-base:${event.channelId}`;
                  const encodedChannelId = toBase64(formattedChannelId);
                  return (
                    <a
                      href={`https://zapper.xyz/chat?channelId=${encodedChannelId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-900 text-center rounded-xl w-24 h-8 flex items-center justify-center"
                    >
                      {event.channelId}
                    </a>
                  );
                })()}
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
    </div>
  );
}
