import { request, gql } from "graphql-request";

let lastTimeStamp = ~~(new Date().getTime() / 1000);
let user_id = "0xf37680f16b92747ee8537a7e2ccb0e51a7c52a64"
let user_id_query = `id: "${user_id}",`
let users = gql`
    {
        users(where: { ${user_id_query}borrowedReservesCount_gt: 0}){
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

let borrows = gql`
  {
    borrows(first: 10) {
      user {
        id
      }
      timestamp
    }
  }
`;
let repays = gql`
  {
    repays(first: 10) {
      user {
        id
      }
      timestamp
    }
  }
`;
let getUsdPriceEth = gql`
{
  priceOracle(id: "1") {
    usdPriceEth
  }
}
`;
let userReserves = gql`
    {
      userReserves(
        first:3
      ) {
        scaledATokenBalance
        reserve {
          id
          underlyingAsset
          name
          symbol
          decimals
          liquidityRate
          reserveLiquidationBonus
          lastUpdateTimestamp
          aToken {
            id
          }
        }
        usageAsCollateralEnabledOnUser
        stableBorrowRate
        stableBorrowLastUpdateTimestamp
        principalStableDebt
        scaledVariableDebt
        variableBorrowIndex
        lastUpdateTimestamp
      }
    }
`;

let reserveData = gql`
    {
      reserves(first: 1) {
        id
        underlyingAsset
        name
        symbol
        decimals
        isActive
        isFrozen
        usageAsCollateralEnabled
        borrowingEnabled
        stableBorrowRateEnabled
        baseLTVasCollateral
        optimalUtilisationRate
        averageStableRate
        stableRateSlope1
        stableRateSlope2
        baseVariableBorrowRate
        variableRateSlope1
        variableRateSlope2
        variableBorrowIndex
        variableBorrowRate
        totalScaledVariableDebt
        liquidityIndex
        reserveLiquidationThreshold
        aToken {
          id
        }
        vToken {
          id
        }
        sToken {
          id
        }
        availableLiquidity
        stableBorrowRate
        liquidityRate
        totalPrincipalStableDebt
        totalLiquidity
        utilizationRate
        reserveLiquidationBonus
        price {
          priceInEth
        }
        lastUpdateTimestamp
        stableDebtLastUpdateTimestamp
        reserveFactor
      }
    }
`;
request(
    "https://api.thegraph.com/subgraphs/name/aave/protocol-v2",
    users
).then((data) => {
    console.log(data.users[0].collateralReserve, data.users[0].borrowReserve
      );
});

