import { ethers } from "ethers";
import 'dotenv/config';

type provider = ethers.providers.Provider

const moralis_key = process.env.MORALIS_KEY
// console.log(moralis_key)

// const httpUrl = `https://speedy-nodes-nyc.moralis.io/${moralis_key}/avalanche/mainnet`
const httpUrl = `http://127.0.0.1:8545`

export const provider = new ethers.providers.JsonRpcProvider(httpUrl);
