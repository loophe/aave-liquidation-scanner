import { ethers } from 'ethers';
import {
  UiPoolDataProvider,
  UiIncentiveDataProvider,
  ChainId,
} from '@aave/contract-helpers';

import 'dotenv/config'

import { scanner } from './aave_scanner_avalanche'

const moralis_key = process.env.MORALIS_KEY

const provider = new ethers.providers.WebSocketProvider(
    `wss://speedy-nodes-nyc.moralis.io/${moralis_key}/avalanche/mainnet/ws`,
);

const uiPoolDataProviderAddress= '0xdBbFaFC45983B4659E368a3025b81f69Ab6E5093';//Avalanche c-net
const lendingPoolAddressProvider = '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb'; //Avalanche c-net

// View contract used to fetch all reserves data (including market base currency data), and user reserves
const poolDataProviderContract = new UiPoolDataProvider({
  uiPoolDataProviderAddress,
  provider,
  chainId: ChainId.avalanche,
});

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


async function excuteScanner() {

  console.log(`\nTask started on `, Date().toLocaleString())

  const addresses: any[] = []

  const tables =  await scanner()

  let n:number = 0
  tables.forEach((table, i) => {
    table.unhealthyLoans.forEach((user: { user_id: any; }, i: any) => {
      let userAddress = user.user_id
      addresses.push(userAddress)  
      n++
      // console.log(addresses)
    })
  })

  console.log(`Refetching ${n} accounts from chain...`)
  for (let i in addresses){
    var address = addresses[i]
    await userReserves(address)
  }


  console.log(`\nTask finished on `, Date().toLocaleString())  
  process.exit()
}

excuteScanner();
