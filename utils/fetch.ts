import Web3 from "web3";
import { Trade } from "../types";
import { providerUrl } from "../constants/provider";


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