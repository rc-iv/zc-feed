import Image from "next/image";
import { Inter } from "next/font/google";
import Head from "next/head";
import { useState } from "react";
import { type } from "os";

const inter = Inter({ subsets: ["latin"] });

// define event type for typescript
type Event = {
    timestamp: string;
    buyer: string;
    roomId: string;
    cost: string;
    quantity: string;
}

const dummyEvents: Event[] = [
    {
        timestamp: "2021-10-01 12:00:00",
        buyer: "0x1234",
        roomId: "001",
        cost: "0.1",
        quantity: "2",
    },
    {
        timestamp: "2021-10-01 12:00:00",
        buyer: "0x567",
        roomId: "002",
        cost: "0.5",
        quantity: "1",
    },
  ];

export default function Home() {
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
        {dummyEvents.map((event, index)=>(
        <tr key={index} className="bg-gray-700">
            <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                {event.timestamp}
            </td>
            <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                {event.buyer}
            </td>
            <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                {event.roomId}
            </td>
            <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                {event.cost}
            </td>
            <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                {event.quantity}
            </td>
        </tr>
        ))}
      </tbody>
    </table>
  );
}
