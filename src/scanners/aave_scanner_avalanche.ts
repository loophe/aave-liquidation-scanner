import { request, gql } from "graphql-request";

export async function scanner() {  

  var sheets: any[] = [];
  var count = 0;
  var maxCount = 4; 
  var onceAmount = 1000; 
  
  console.log(`\nfetching unhealthy loans`)
  while( count < maxCount ) {
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



    var data = await request(
      "https://api.thegraph.com/subgraphs/name/aave/protocol-v3-avalanche",
      users
    )
    const unhealthyLoans = parseUsers(data)
    if ( unhealthyLoans.length > 0 ){
      sheets.push( { unhealthyLoans }) 
    }
    count++;    

  } 
  return sheets
}


function parseUsers( payload: { users: any[]; } ) {

  const healthFactorMax = 1 //liquidation can happen when less than 1
  var loans: any[] =[];

  payload.users.forEach((user, i) => {
    var totalBorrowed=0;
    var totalCollateralThreshold=0;
    user.borrowReserve.forEach((borrowReserve: { reserve: { price: { priceInEth: any; }; decimals: number; symbol: any; }; currentTotalDebt: any; }, i: any) => {
      var priceInEth= borrowReserve.reserve.price.priceInEth
      var principalBorrowed = borrowReserve.currentTotalDebt
      totalBorrowed += priceInEth * principalBorrowed / (10**borrowReserve.reserve.decimals)
    
    });

    user.collateralReserve.forEach((collateralReserve: { reserve: { price: { priceInEth: any; }; decimals: number; reserveLiquidationThreshold: number; reserveLiquidationBonus: number; symbol: any; }; currentATokenBalance: any; }, i: any) => {
      var priceInEth= collateralReserve.reserve.price.priceInEth
      var principalATokenBalance = collateralReserve.currentATokenBalance

        totalCollateralThreshold += priceInEth * principalATokenBalance * (collateralReserve.reserve.reserveLiquidationThreshold/10000)/ (10**collateralReserve.reserve.decimals)
 
    });

    var healthFactor = totalCollateralThreshold / totalBorrowed;
    

    if ( healthFactor <= healthFactorMax && healthFactor > 0.8 ) {
     
      loans.push( {
        "user_id"  :  user.id,
        "healthFactor"   :  healthFactor,
        "totalBorrowed": totalBorrowed,
        "totalCollateralT": totalCollateralThreshold
      })
    }

  })

  return loans;

}

  