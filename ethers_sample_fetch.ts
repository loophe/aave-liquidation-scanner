import { ethers } from 'ethers';
import {
  UiPoolDataProvider,
  UiIncentiveDataProvider,
  ChainId,
} from '@aave/contract-helpers';
import 'dotenv/config'

import { formatReserves } from '@aave/math-utils';
import dayjs from 'dayjs';


// Sample RPC address for querying ETH mainnet
// const provider = new ethers.providers.JsonRpcProvider(
//     'https://eth-mainnet.alchemyapi.io/v2/4xh4V6Rh8xBPsROuHt8REhelNUF9o_Kk',
//   );
const moralis_key = process.env.MORALIS_KEY

const provider = new ethers.providers.WebSocketProvider(
    `wss://speedy-nodes-nyc.moralis.io/${moralis_key}/avalanche/mainnet/ws`,
);

// Aave protocol contract addresses, will be different for each market and can be found at https://docs.aave.com/developers/deployed-contracts/deployed-contracts
// For V3 Testnet Release, contract addresses can be found here https://github.com/aave/aave-ui/blob/feat/arbitrum-clean/src/ui-config/markets/index.ts
// const uiPoolDataProviderAddress = '0xa2DC1422E0cE89E1074A6cd7e2481e8e9c4415A6';//Ethereum mainnet
const uiPoolDataProviderAddress= '0xdBbFaFC45983B4659E368a3025b81f69Ab6E5093';//Avalanche c-net
// const uiIncentiveDataProviderAddress =
//   '0xD01ab9a6577E1D84F142e44D49380e23A340387d';
// const lendingPoolAddressProvider = '0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5';//Ethereum mainnet

const lendingPoolAddressProvider = '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb'; //Avalanche c-net

// User address to fetch data for
// const currentAccount = '0xd739b3962642dd0354a40ebca5e223bf3868bd3c';//Ethereum miannet

// View contract used to fetch all reserves data (including market base currency data), and user reserves
const poolDataProviderContract = new UiPoolDataProvider({
    uiPoolDataProviderAddress,
    provider,
    chainId: ChainId.avalanche,
  });
  
// View contract used to fetch all reserve incentives (APRs), and user incentives
// const incentiveDataProviderContract = new UiIncentiveDataProvider({
//     uiIncentiveDataProviderAddress,
//     provider,
//     chainId: ChainId.mainnet,
// });

// Note, contract calls should be performed in an async block, and updated on interval or on network/market change

// Object containing array of pool reserves and market base currency data
// { reservesArray, baseCurrencyData }
async function main() {
 
    try
    {
        const reserves =
            await poolDataProviderContract.getReservesHumanized({
            lendingPoolAddressProvider,
        });

        const reservesArray = reserves.reservesData;
        const baseCurrencyData = reserves.baseCurrencyData;

        const currentTimestamp = dayjs().unix();

        /*
        - @param `reserves` Input from [Fetching Protocol Data](#fetching-protocol-data), `reserves.reservesArray`
        - @param `currentTimestamp` Current UNIX timestamp in seconds
        - @param `marketReferencePriceInUsd` Input from [Fetching Protocol Data](#fetching-protocol-data), `reserves.baseCurrencyData.marketReferencePriceInUsd`
        - @param `marketReferenceCurrencyDecimals` Input from [Fetching Protocol Data](#fetching-protocol-data), `reserves.baseCurrencyData.marketReferenceCurrencyDecimals`
        */
        const formattedPoolReserves = formatReserves({
            reserves: reservesArray,
            currentTimestamp,
            marketReferenceCurrencyDecimals:
              baseCurrencyData.marketReferenceCurrencyDecimals,
            marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
        });
        console.log(formattedPoolReserves)
        // for (let key in formattedPoolReserves){
        //   console.log(formattedPoolReserves[key].priceInUSD)
        // }

        process.exit();

    }catch(e){
        console.log(e)
    }
    
}

main()

// Object containing array or users aave positions and active eMode category
// { userReserves, userEmodeCategoryId }

async function userReserves(currentAccount: any) {
    const data = 
        await poolDataProviderContract.getUserReservesHumanized({
            user:currentAccount,
            lendingPoolAddressProvider 
    }); 
    data.userReserves.forEach(reserve => {
        if ( reserve.scaledATokenBalance != '0' || reserve.scaledVariableDebt != '0')
        // console.log(reserve)
        return
    });
    // console.log(userReserves)
}



// Array of incentive tokens with price feed and emission APR
// const reserveIncentives = a
// await incentiveDataProviderContract.getReservesIncentivesDataHumanized({
//     lendingPoolAddressProvider:lendingPoolAddressProvider,
// });

// Dictionary of claimable user incentives
// const userIncentives =
// await incentiveDataProviderContract.getUserReservesIncentivesDataHumanized({
//     lendingPoolAddressProvider:lendingPoolAddressProvider,
//     user:currentAccount,
// });

// reserves input from Fetching Protocol Data section


// const baseCurrencyData = reserves.baseCurrencyData;

// const currentTimestamp = dayjs().unix();

/*
- @param `reserves` Input from [Fetching Protocol Data](#fetching-protocol-data), `reserves.reservesArray`
- @param `currentTimestamp` Current UNIX timestamp in seconds
- @param `marketReferencePriceInUsd` Input from [Fetching Protocol Data](#fetching-protocol-data), `reserves.baseCurrencyData.marketReferencePriceInUsd`
- @param `marketReferenceCurrencyDecimals` Input from [Fetching Protocol Data](#fetching-protocol-data), `reserves.baseCurrencyData.marketReferenceCurrencyDecimals`
*/
// const formattedPoolReserves = formatReserves({
//     reserves: reservesArray,
//     currentTimestamp,
//     marketReferenceCurrencyDecimals:
//       baseCurrencyData.marketReferenceCurrencyDecimals,
//     marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
// });
// console.log(formattedPoolReserves)

