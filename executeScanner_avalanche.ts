import { ethers } from 'ethers';
import * as fs from "fs";
import * as path from "path";
import { UiPoolDataProvider,ChainId } from '@aave/contract-helpers';
import { TOKEN_LIST } from './constants';
import { scanner } from './scanners/aave_scanner_avalanche'



// const provider = new ethers.providers.WebSocketProvider(
//     `wss://speedy-nodes-nyc.moralis.io/${moralis_key}/avalanche/mainnet/ws`,
// );
// const provider = new ethers.providers.JsonRpcProvider(
//   `https://speedy-nodes-nyc.moralis.io/${moralis_key}/avalanche/mainnet`
// )
// const provider = new ethers.providers.Web3Provider(
//   wsProvider
// )
// console.log(provider)



// const currentAccount = '0x00953ad692156624e4da9a64e72edadf6ee178f5';//Avalanche c-net
// const currentAccount = '0x506884697f0bb3715b0ff07ab256bce1e705cf4b';//Avalanche c-net
// const currentAccount = '0x863c9aade08c7e024a4c7a2884c6024711ccb11a'

// Object containing array or users aave positions and active eMode category
// { userReserves, userEmodeCategoryId }
async function userReserves(currentAccount: string, provider: ethers.providers.Provider ) {

  const uiPoolDataProviderAddress= '0xdBbFaFC45983B4659E368a3025b81f69Ab6E5093';//Avalanche c-net
  const lendingPoolAddressProvider = '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb'; //Avalanche c-net
  const floorAmount = 10 // Variable USD amount lower than this number will be ignored.
  // View contract used to fetch all reserves data (including market base currency data), and user reserves
  const poolDataProviderContract = new UiPoolDataProvider({
    uiPoolDataProviderAddress,
    provider,
    chainId: ChainId.avalanche,
  });

  const data = 
    await poolDataProviderContract.getUserReservesHumanized({
        user:currentAccount,
        lendingPoolAddressProvider 
  }); 

  const userReserves: any[] = []

  data.userReserves.forEach(( 
    reserve: { 
      usageAsCollateralEnabledOnUser: boolean; 
      underlyingAsset: string; 
      scaledATokenBalance: string; 
      scaledVariableDebt: string; 
      principalStableDebt: string;
    }) => {
    if ( reserve.scaledATokenBalance != '0' || reserve.scaledVariableDebt != '0'){
      const index = reserve.underlyingAsset     
      const symbol = TOKEN_LIST[index].symbol
      var reserveObject = {
        "symbol": symbol,
        "address":index,        
        "usageAsCollateralEnabledOnUser":reserve.usageAsCollateralEnabledOnUser,
        "scaledATokenBalance":reserve.scaledATokenBalance,
        "scaledVariableDebt":reserve.scaledVariableDebt,
        "principalStableDebt":reserve.principalStableDebt,
        "decimals":TOKEN_LIST[index].decimals,
        "threshold":TOKEN_LIST[index].reserveLiquidationThreshold,
        "bonus":TOKEN_LIST[index].reserveLiquidationBonus,
        "EmodeThreshold":TOKEN_LIST[index].eModeLiquidationThreshold,
        "EmodeBonus":TOKEN_LIST[index].eModeLiquidationBonus,

      }
      userReserves.push(reserveObject)
    }  
  });

  const reservesValueInBase: any[] = []
  
  for ( let i in userReserves ){

    var address = userReserves[i].address
    var priceOracleAddress = TOKEN_LIST[address].priceOracle

    const priceOracleContract = new ethers.Contract(
      priceOracleAddress,
      ['function latestRoundData() external view returns (uint80 roundId,int256 answer,uint256 startedAt,uint256 updatedAt,uint80 answeredInRound)'],
      provider
    )

    const priceRes = await priceOracleContract.latestRoundData()
    // console.log(priceRes)

    const priceInBase = priceRes[1].toString()
    // console.log(priceInBase)
    const decimals = 10 ** (userReserves[i].decimals + 8)
 
    const scaledATokenBalanceInBase = Math.floor( userReserves[i].scaledATokenBalance / decimals * priceInBase )
    const principalStableDebtInBase = Math.floor( userReserves[i].principalStableDebt / decimals * priceInBase )
    const scaledVariableDebtInBase = Math.floor( userReserves[i].scaledVariableDebt / decimals * priceInBase )
    if ( scaledATokenBalanceInBase > floorAmount || principalStableDebtInBase > floorAmount || scaledVariableDebtInBase > floorAmount ){
      var valueObject = {
        "address":address,
        "symbol":userReserves[i].symbol,
        "bonus":userReserves[i].bonus,
        "scaledATokenBalanceInBase":  scaledATokenBalanceInBase,
        "principalStableDebtInBase":principalStableDebtInBase,
        "scaledVariableDebtInBase":scaledVariableDebtInBase
      }  
      reservesValueInBase.push(valueObject)
    }   

  }
  // console.log(reservesValueInBase, userReserves)
  const result = await parseUser( reservesValueInBase, data.userEmodeCategoryId )
  console.log(currentAccount, result, data.userEmodeCategoryId)

}


async function parseUser( userReserves: any[], userEmodeCategoryId: number) {


  let max_bonus = '10000'
  const result = {
    "max_collacteral": "0x",
    "max_collacteralAmount": 1,
    "max_reserve": "0x",
    "max_reserveAmount" : 1
  }
  

  if ( userEmodeCategoryId === 0){
    
    userReserves.forEach(( reserve, i) => {
      if ( reserve.scaledATokenBalanceInBase >= result.max_collacteralAmount ){
        if ( reserve.bonus > max_bonus){
          max_bonus = reserve.bonus      
          result.max_collacteral = reserve.address
          result.max_collacteralAmount = reserve.scaledATokenBalanceInBase

        }
      }      
    })
  }else{
    userReserves.forEach(( reserve, i) => {
      if (  
            reserve.address != '0xd586e7f844cea2f87f50152665bcbc2c279d8d70' && 
            reserve.address != '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e' && 
            reserve.address != '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7'
          ) {
            if ( reserve.scaledATokenBalanceInBase >= result.max_collacteralAmount ){
              if ( reserve.bonus > max_bonus){
                max_bonus = reserve.bonus      
                result.max_collacteral = reserve.address
                result.max_collacteralAmount = reserve.scaledATokenBalanceInBase
              }
            }   
      }
    })
  }


  userReserves.forEach( ( reserve, i) => {

    const reserveAmount = reserve.principalStableDebtInBase + reserve.scaledVariableDebtInBase
    if ( reserveAmount >= result.max_reserveAmount){
      result.max_reserve = reserve.address
      result.max_reserveAmount = reserveAmount
    }
  })

  return result
 
}



export async function executeScanner(provider: ethers.providers.Provider) {

  const lendingPool = '0x794a61358D6845594F94dc1DB02A252b5b4814aD';//Avalanche c-net

  //View contract used to check healthy of accounts.
  const lendingPoolContract = new ethers.Contract(
    lendingPool,
    ['function getUserAccountData(address user) external view returns ( uint256 totalCollateralETH, uint256 totalDebtETH, uint256 availableBorrowsETH, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor )'],
    provider
  )

  console.log(`\nTask started on `, Date().toLocaleString())

  const addresses: any[] = []

  const sheets =  await scanner()

  let n:number = 0

  fs.readFile(path.join(__dirname, 'tables',`table.json`), async (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    const dataJ = JSON.parse(data.toString());
    sheets.forEach((sheet, i) => {
      sheet.unhealthyLoans.forEach((user: { user_id: any; }, i: any) => {
        let userAddress = user.user_id
        const isBlackAccount = IsInArray(dataJ, userAddress)
        if ( !isBlackAccount ){
          addresses.push(userAddress)  
          n++
        }        
      })
    })

    console.log(`Refetching ${n} accounts from chain...`)

    for (let i in addresses){

      var address = addresses[i] 
      const userAccountData = await lendingPoolContract.getUserAccountData(address)
      const dataString = userAccountData[5].toString()
      const accountHealthy = dataString / 10**18
      if ( dataString == "115792089237316195423570985008687907853269984665640564039457584007913129639935"){
    
        console.log("Black listed account!")
      }else{
        console.log(accountHealthy,address)
        if ( accountHealthy < 1 )  
        await userReserves(address, provider)
      }      
    }
  
    console.log(`\nTask finished on `, Date().toLocaleString())  

  }) 

}


function IsInArray(arr: any[],val: string){
  var testStr=','+arr.join(",")+",";
  return testStr.indexOf(","+val+",")!=-1;
}

