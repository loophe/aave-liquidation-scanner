import { ethers } from 'ethers';
import fs from "fs";
import path from "path";
import 'dotenv/config'
import { scanner } from './aave_scanner_avalanche'

const moralis_key = process.env.MORALIS_KEY

const provider = new ethers.providers.WebSocketProvider(
    `wss://speedy-nodes-nyc.moralis.io/${moralis_key}/avalanche/mainnet/ws`,
);
// const provider = new ethers.providers.JsonRpcProvider(
//   `https://speedy-nodes-nyc.moralis.io/${moralis_key}/avalanche/mainnet`
// )


const lendingPool = '0x794a61358D6845594F94dc1DB02A252b5b4814aD';//Avalanche c-net


//View contract used to check healthy of accounts.
const lendingPoolContract = new ethers.Contract(
  lendingPool,
  ['function getUserAccountData(address user) external view returns ( uint256 totalCollateralETH, uint256 totalDebtETH, uint256 availableBorrowsETH, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor )'],
  provider
)

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
    })
  })
  
  console.log(`Refetching ${n} accounts from chain...`)

  const blackAccountsList: any[] = []

//   fs.readFile(path.join(__dirname, 'tables',`table.json`), async (err, data) => {
//     if (err) {
//         console.error(err);
//         return;
//     }
//     const dataJ = JSON.parse(data.toString());
    // console.log(dataJ)
    for (let i in addresses){
      var address = addresses[i] 
 
    //   const isBlackAccount = IsInArray(dataJ, address)
    //   if ( !isBlackAccount ){
        const userAccountData = await lendingPoolContract.getUserAccountData(address)
        const dataString = userAccountData[5].toString()
      
        if ( dataString == "115792089237316195423570985008687907853269984665640564039457584007913129639935"){
          blackAccountsList.push(address)
          console.log("Black listed account!")
        }
    //   }
      
      
    }
   writetable(blackAccountsList)
//   }) 
  
  
  console.log(`\nTask finished on `, Date().toLocaleString())  
  // process.exit()
}



function writetable(arr:any[]){
  // console.log(arr)
  // blackAccountTable.push({"blackAccounts":arr})
  var content = JSON.stringify(arr)
  // console.log(content)
  fs.writeFile(path.join(__dirname, `tables/table.json`), content, err => {
    if (err) {
    console.error(err)
    return
    }
    //file written successfully
  })

}
// function IsInArray(arr: any[],val: string){
//   var testStr=','+arr.join(",")+",";
//   return testStr.indexOf(","+val+",")!=-1;
// }

excuteScanner();
// writetable(blackAccountTable)


