import { request, gql } from "graphql-request";

export async function scanner() {  

  var sheets: any[] = [];
  var count = 0;
  var maxCount = 4; 
  var onceAmount = 1000; 
  
  console.log(`\nfetching unhealthy loans`)
  while( count < maxCount ) {
    // let lastTimeStamp = ~~(new Date().getTime() / 1000);
    // let user_id = "0xf37680f16b92747ee8537a7e2ccb0e51a7c52a64"//collateral undifined
    // let user_id = "0x934a83805958237abcbacd06054a12641799273d" //threshold error on contract 
    // let user_id ='0xeff73f588b763204ad8505ef6427d92c827057b3' 
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
  // var profit_threshold = .1 * (10**8) //in eth. A bonus below this will be ignored
  // const allowedLiquidation = 1 //100% of a borrowed asset can be liquidated

  var loans: any[] =[];

  payload.users.forEach((user, i) => {
    var totalBorrowed=0;
    // var totalCollateral=0;
    var totalCollateralThreshold=0;
    // var max_borrowedSymbol: any;
    // var max_borrowedDecimals: any;
    // var max_borrowedPrincipal=0;
    // var max_borrowedPriceInEth = 0;
    // var max_collateralSymbol: any;
    // var max_collateralBonus=0;
    // var max_collateralPriceInEth = 0;

    user.borrowReserve.forEach((borrowReserve: { reserve: { price: { priceInEth: any; }; decimals: number; symbol: any; }; currentTotalDebt: any; }, i: any) => {
      var priceInEth= borrowReserve.reserve.price.priceInEth
      var principalBorrowed = borrowReserve.currentTotalDebt
      totalBorrowed += priceInEth * principalBorrowed / (10**borrowReserve.reserve.decimals)
      // if (principalBorrowed > max_borrowedPrincipal){
      //   max_borrowedSymbol = borrowReserve.reserve.symbol
      //   max_borrowedDecimals = borrowReserve.reserve.decimals
      //   max_borrowedPrincipal = principalBorrowed
      //   max_borrowedPriceInEth = priceInEth
      // }        
    });

    user.collateralReserve.forEach((collateralReserve: { reserve: { price: { priceInEth: any; }; decimals: number; reserveLiquidationThreshold: number; reserveLiquidationBonus: number; symbol: any; }; currentATokenBalance: any; }, i: any) => {
      var priceInEth= collateralReserve.reserve.price.priceInEth
      var principalATokenBalance = collateralReserve.currentATokenBalance
      // totalCollateral += priceInEth * principalATokenBalance / (10**collateralReserve.reserve.decimals)

      // if ( collateralReserve.reserve.symbol == 'DAI.e' || collateralReserve.reserve.symbol == 'USDC' ){
      //   totalCollateralThreshold += priceInEth * principalATokenBalance * ( 0.975 / (10**collateralReserve.reserve.decimals))//Token DAI.e and USDC threshold is 97.5%
      // }else{
        totalCollateralThreshold += priceInEth * principalATokenBalance * (collateralReserve.reserve.reserveLiquidationThreshold/10000)/ (10**collateralReserve.reserve.decimals)
      // }
      
      // if (collateralReserve.reserve.reserveLiquidationBonus > max_collateralBonus){
      //   max_collateralSymbol = collateralReserve.reserve.symbol
      //   max_collateralBonus=collateralReserve.reserve.reserveLiquidationBonus
      //   max_collateralPriceInEth = priceInEth
      // }
    });

    var healthFactor = totalCollateralThreshold / totalBorrowed;
    

    if ( healthFactor <= healthFactorMax && healthFactor > 0.8 ) {
     
      loans.push( {
        "user_id"  :  user.id,
        "healthFactor"   :  healthFactor,
        "totalBorrowed": totalBorrowed,
        "totalCollateralT": totalCollateralThreshold
        // "max_collateralSymbol" : max_collateralSymbol,
        // "max_borrowedSymbol" : max_borrowedSymbol,
        // "max_borrowedPrincipal" : max_borrowedPrincipal,
        // "max_borrowedPriceInEth" : max_borrowedPriceInEth,
        // "max_collateralBonus" : max_collateralBonus/10000,
        // "max_collateralPriceInEth" : max_collateralPriceInEth
      })


    // console.log(`\nuserId`, user.id)
    // console.log('healthFactor', healthFactor)
    // console.log('totalBorrowed', totalBorrowed)
    // console.log('totalCollateralThreshold', totalCollateralThreshold)
    }

    // loans = loans.filter((loan) => {
    //   // blackAccountsList.forEach((blackAccount, i)=>{
    //     // if ( loan.user_id != blackAccount )
    //     if ( 
    //       loan.user_id != '0x3b02c328cba97fe8d1edf82c6261abf9c6e4f585' && 
    //       loan.user_id != '0xe36b0fcad85e29d59aeae916de66f5a93c8879b7' &&
    //       loan.user_id != '0xcfa182c468876e79f4b4b6383f4226de6d985019' &&
    //       loan.user_id != '0xf0d74983a35f07cff90b88d9ed71c03d03304d73' &&
    //       loan.user_id != '0x77dc4b827300a4937146dfbd6049dfd2340ae66b' &&
    //       loan.user_id != '0x77713f2c8f60f1678556e143adaf71fcee3825e9' &&
    //       loan.user_id != '0x2bd7d71390ed6946159b1cb49bc270cbe3ef1a53' &&
    //       loan.user_id != '0xfe238db1de2082bb9ba5dfc184b7e7c69c9be636' &&
    //       loan.user_id != '0x01bfcd5bfe983ee701a28e12c4f7fc77dd4452fd' &&
    //       loan.user_id != '0x682da57b6d854786b45848884c29a4d3c7b1ad03' &&
    //       loan.user_id != '0xfd2d9fde6453b38b64d69fe3af0f442b254006ca' &&
    //       loan.user_id != '0xa177fb36af688172a3527ae5b2f8489719e7c206' &&
    //       loan.user_id != '0xe996fda4caa3c3f19649e012a5869642c31a8537' &&//error debt and collactrol amount
    //       loan.user_id != '0xc2bfadf539272693ac53821d8ad4766bd9334d2d'
    //       )
    //     // return loan.max_borrowedPrincipal * allowedLiquidation * (loan.max_collateralBonus-1) * loan.max_borrowedPriceInEth / 10 ** max_borrowedDecimals >= profit_threshold
    //       return loan
    //     // })      
    // })

  })

  return loans;

}

  