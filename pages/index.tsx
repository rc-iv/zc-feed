import Image from "next/image";
import { Inter } from "next/font/google";
import Head from "next/head";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main className={`flex min-h-screen flex-col items-center`}>
      <Head>
        <title>Zapper Chats Feed</title>
      </Head>

      <h1 className="text-4xl m-20">Zapper Chats Feed</h1>
      <div className="relative flex place-items-center">
        <Image
          className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70]"
          src="/images/logo.png"
          alt="Next.js Logo"
          width={180}
          height={37}
          priority
        />
      </div>
      <div className='bg-gray-900 m-20 rounded-xl'>
        <Link href="/table/events"><h1 className="text-4xl p-4">Connect</h1></Link>
      </div>
    </main>
  );
}
