import { ethers } from "ethers";
import 'dotenv/config';

type provider = ethers.providers.Provider

const moralis_key = process.env.MORALIS_KEY

const wsUrl = `wss://speedy-nodes-nyc.moralis.io/${moralis_key}/avalanche/mainnet/ws`

export const provider = new ethers.providers.WebSocketProvider(wsUrl);


