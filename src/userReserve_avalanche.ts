
import { ethers } from 'ethers';
import { UiPoolDataProvider,ChainId } from '@aave/contract-helpers';
import { TOKEN_LIST } from './constants/tokenIndex';
import { checkResultErrors } from 'ethers/lib/utils';


// Object containing array or users aave positions and active eMode category
// { userReserves, userEmodeCategoryId }
export async function userReserves(currentAccount: string, provider: ethers.providers.Provider ) {

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
          "scaledATokenBalance":userReserves[i].scaledATokenBalance,
          "scaledATokenBalanceInBase":  scaledATokenBalanceInBase,
          "principalStableDebt":userReserves[i].principalStableDebt,
          "principalStableDebtInBase":principalStableDebtInBase,
          "scaledVariableDebt":userReserves[i].scaledVariableDebt,
          "scaledVariableDebtInBase":scaledVariableDebtInBase
        }  
        reservesValueInBase.push(valueObject)
      }   
  
    }

    const result = await parseUser( reservesValueInBase, data.userEmodeCategoryId )
 
  
    return result
  
}

async function parseUser( userReserves: any[], userEmodeCategoryId: number) {


    let max_bonus = '10000'
    const result = {
   
      "max_collacteral": "0x",
      "max_collacteralBalance": 1,
      "max_collacteralAmount": 1,
      "max_reserve": "0x",
      "max_reserveBalance": 1,
      "max_reserveAmount" : 1
    }
    
  
    if ( userEmodeCategoryId === 0){
      
      userReserves.forEach(( reserve, i) => {
        if ( reserve.scaledATokenBalanceInBase >= result.max_collacteralAmount ){
          if ( reserve.bonus > max_bonus){
            max_bonus = reserve.bonus
            result.max_collacteral = reserve.address
            result.max_collacteralAmount = reserve.scaledATokenBalanceInBase
            result.max_collacteralBalance = reserve.scaledATokenBalance
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
                  result.max_collacteralBalance = reserve.scaledATokenBalance
                }
              }   
        }
      })
    }
  
  
    userReserves.forEach( ( reserve, i) => {
  
      const reserveAmount = reserve.principalStableDebtInBase + reserve.scaledVariableDebtInBase
      const reserveBalance = parseInt(reserve.principalStableDebt) + parseInt(reserve.scaledVariableDebt)
      if ( reserveAmount >= result.max_reserveAmount){
        result.max_reserve = reserve.address
        result.max_reserveAmount = reserveAmount
        result.max_reserveBalance = reserveBalance
      }
    })
  
    return result
   
}
  
  
  