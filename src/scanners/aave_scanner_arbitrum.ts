import { request, gql } from "graphql-request";

const scanner = async() => {  

  var count = 0;
  var maxCount = 5; 
  var onceAmount = 1000; 
  
  console.log(`\n${Date().toLocaleString()} fetching unhealthy loans\n`)
  while( count < maxCount ) {
    let lastTimeStamp = ~~(new Date().getTime() / 1000);
    // let user_id = "0xf37680f16b92747ee8537a7e2ccb0e51a7c52a64"//collateral undifined
    // let user_id = "0x934a83805958237abcbacd06054a12641799273d" //threshold error on contract  
    // let user_id_query = `id: "${user_id}",`
    let user_id_query = ""
    let users = gql`
        {
            users(first: ${onceAmount}, skip: ${onceAmount*count}, orderBy: id, orderDirection: desc, where: { ${user_id_query}borrowedReservesCount_gt: 0}){
                id
                borrowedReservesCount
                collateralReserve:reserves (where: {currentATokenBalance_gt: 0}){
                    currentATokenBalance
                    reserve{
                      usageAsCollateralEnabled
                      reserveLiquidationThreshold
                      reserveLiquidationBonus
                      borrowingEnabled
                      utilizationRate
                      symbol
                      underlyingAsset
                      price {
                        priceInEth
                      }
                      decimals
                    }
                }
                borrowReserve: reserves(where: {currentTotalDebt_gt: 0}) {
                    currentTotalDebt
                    reserve{
                      usageAsCollateralEnabled
                      reserveLiquidationThreshold
                      borrowingEnabled
                      utilizationRate
                      symbol
                      underlyingAsset
                      price {
                        priceInEth
                      }
                      decimals
                    }
                }
            }
        }
    `;



    request(
    //   "https://api.thegraph.com/subgraphs/name/aave/protocol-v3-polygon",
        "https://api.thegraph.com/subgraphs/name/aave/protocol-v3-arbitrum",
        users
    ).then((data) => {

      const total_loans = data.users.length
      const unhealthyLoans = parseUsers(data);
      if ( unhealthyLoans.length > 0 )
        console.log('UnhealthyLoan :',unhealthyLoans[0].user_id)
      if ( total_loans > 0 ) 
        console.log( `Records:${total_loans} Unhealthy:${unhealthyLoans.length}\n`)
        // console.log(data.users
        //   );
    });

    count++;    

  } 
}

function parseUsers( payload: { users: any[]; } ) {

  const healthFactorMax = 1 //liquidation can happen when less than 1
  var profit_threshold = 100 * (10**8) //in eth. A bonus below this will be ignored
  const allowedLiquidation = .5 //50% of a borrowed asset can be liquidated

  var loans: any[] =[];

  payload.users.forEach((user, i) => {
    var totalBorrowed=0;
    var totalCollateral=0;
    var totalCollateralThreshold=0;
    var max_borrowedSymbol: any;
    var max_borrowedDecimals: any;
    var max_borrowedPrincipal=0;
    var max_borrowedPriceInEth = 0;
    var max_collateralSymbol: any;
    var max_collateralBonus=0;
    var max_collateralPriceInEth = 0;

    user.borrowReserve.forEach((borrowReserve: { reserve: { price: { priceInEth: any; }; decimals: number; symbol: any; }; currentTotalDebt: any; }, i: any) => {
      var priceInEth= borrowReserve.reserve.price.priceInEth
      var principalBorrowed = borrowReserve.currentTotalDebt
      totalBorrowed += priceInEth * principalBorrowed / (10**borrowReserve.reserve.decimals)
      if (principalBorrowed > max_borrowedPrincipal){
        max_borrowedSymbol = borrowReserve.reserve.symbol
        max_borrowedDecimals = borrowReserve.reserve.decimals
        max_borrowedPrincipal = principalBorrowed
        max_borrowedPriceInEth = priceInEth
      }        
    });

    user.collateralReserve.forEach((collateralReserve: { reserve: { price: { priceInEth: any; }; decimals: number; reserveLiquidationThreshold: number; reserveLiquidationBonus: number; symbol: any; }; currentATokenBalance: any; }, i: any) => {
      var priceInEth= collateralReserve.reserve.price.priceInEth
      var principalATokenBalance = collateralReserve.currentATokenBalance
      totalCollateral += priceInEth * principalATokenBalance / (10**collateralReserve.reserve.decimals)
      totalCollateralThreshold += priceInEth * principalATokenBalance * (collateralReserve.reserve.reserveLiquidationThreshold/10000)/ (10**collateralReserve.reserve.decimals)
      if (collateralReserve.reserve.reserveLiquidationBonus > max_collateralBonus){
        max_collateralSymbol = collateralReserve.reserve.symbol
        max_collateralBonus=collateralReserve.reserve.reserveLiquidationBonus
        max_collateralPriceInEth = priceInEth
      }
    });

    var healthFactor = totalCollateralThreshold / totalBorrowed;
    
    // console.log('userId', user.id)
    // console.log('healthFactor', healthFactor)
    // console.log('totalBorrowed', totalBorrowed)
    // console.log('totalCollateralThreshold', totalCollateralThreshold)

    if ( healthFactor <= healthFactorMax ) {
     
      loans.push( {
        "user_id"  :  user.id,
        "healthFactor"   :  healthFactor,
        "max_collateralSymbol" : max_collateralSymbol,
        "max_borrowedSymbol" : max_borrowedSymbol,
        "max_borrowedPrincipal" : max_borrowedPrincipal,
        "max_borrowedPriceInEth" : max_borrowedPriceInEth,
        "max_collateralBonus" : max_collateralBonus/10000,
        "max_collateralPriceInEth" : max_collateralPriceInEth
      })

    }

    loans = loans.filter((loan) => {
      return loan.max_borrowedPrincipal * allowedLiquidation * (loan.max_collateralBonus-1) * loan.max_borrowedPriceInEth / 10 ** max_borrowedDecimals >= profit_threshold
    })

  })

  return loans;

}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const excuteScan = async () => {
  while( 1==1 ){
    scanner();
    await sleep(60_000);
  }  
}

excuteScan();
  