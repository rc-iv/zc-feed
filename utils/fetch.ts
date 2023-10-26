import Web3 from "web3";
import { Trade, Trader, ZapperResponse } from "../types";
import { providerUrl } from "../constants/provider";
import axios from "axios";

export const fetchTrades = async (
  contract: any,
  fromBlock: string,
  toBlock: string,
  web3: Web3 = new Web3(providerUrl)
): Promise<Trade[]> => {
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
  const newTradeEvents: Trade[] = newEvents.filter(
    (event): event is Trade => event !== null
  );
  return newTradeEvents;
};

export const fetchRoomCreations = async (
  contract: any,
  fromBlock: string,
  toBlock: string,
  web3: Web3 = new Web3(providerUrl)
): Promise<Trade[]> => {
  console.log(`fetching room creations from ${fromBlock} to ${toBlock}`);
  let rawEvents: any[] = [];

  try {
    rawEvents = await (contract as any).getPastEvents("ChannelCreated", {
      fromBlock: fromBlock,
      toBlock: "latest",
    });
  } catch (error) {
    console.error("Error fetching raw events:", error);
  }

  if (rawEvents.length === 0) {
    return [];
  }

  const newChannels = await Promise.all(
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

        return {
          buyer: returnValues.channelCreator,
          channelId: returnValues.channelId.toString(),
          transactionType: "channelCreation",
          shareQuantity: "NA",
          ethAmount: "NA",
          timestamp,
          transactionHash,
        };
      } catch (error) {
        console.error("Error in Promise.all map:", error);
        return null; // Return null in case of errors
      }
    })
  );
  const newTradeEvents: Trade[] = newChannels.filter(
    (event): event is Trade => event !== null
  );
  return newTradeEvents;
};

// Function to calculate netAppValue
const calculateNetAppValue = (data: ZapperResponse): number => {
  // Initialize netAppValue to 0
  let netAppValue = 0;

  // Loop through each app data object in the response array
  data.forEach((appData) => {
    // Add the app's own balanceUSD to netAppValue
    netAppValue += appData.balanceUSD;

    // Loop through each product in the app data object's 'products' array
    appData.products.forEach((product) => {
      // Loop through each asset in the product's 'assets' array
      product.assets.forEach((asset) => {
        // Add the asset's balanceUSD to netAppValue
        netAppValue += asset.balanceUSD;
      });
    });
  });

  return netAppValue;
};

// Function to get USD value of the app "chain-chat"
const getChainChatUSDValue = (data: ZapperResponse): number => {
    // Initialize variable to hold the USD value for "chain-chat"
    let chainChatUSDValue = 0;
  
    // Filter data to only include app data objects where appName is "Chainchat"
    const filteredData = data.filter((appData) => appData.appName === "Chainchat");
  
    // Loop through the filtered app data objects
    filteredData.forEach((appData) => {
      // Add the app's own balanceUSD to chainChatUSDValue
      chainChatUSDValue += appData.balanceUSD;
  
      // Loop through each product in the app data object's 'products' array
      appData.products.forEach((product) => {
        // Loop through each asset in the product's 'assets' array
        product.assets.forEach((asset) => {
          // Add the asset's balanceUSD to chainChatUSDValue
          chainChatUSDValue += asset.balanceUSD;
        });
      });
    });
  
    return chainChatUSDValue/2;
  };

export const fetchTraderInfo = async (
  address: string,
  apiKey: string
): Promise<Trader> => {
  const trader: Trader = {
    address: address,
    netWorth: "0",
    nftValue: "0",
    appValue: "0",
  };

  try {
    const url = `https://api.zapper.xyz/v2/balances/apps?addresses%5B%5D=${address.toLowerCase()}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${apiKey}`, // Assuming Basic Authentication, adapt as needed
        accept: "*/*",
      },
    });

    const data = response.data;

    const netAppValue = calculateNetAppValue(data);
    trader.appValue = netAppValue.toString();
    console.log(`Net App Value: ${netAppValue}`);

    const chainChatUSDValue = getChainChatUSDValue(data);
    trader.chainChatValue = chainChatUSDValue.toString();
    console.log(`Chainchat USD Value: ${chainChatUSDValue}`);

    // delay 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    console.error(`Error fetching trader info: ${error}`);
  }

  return trader;
};
