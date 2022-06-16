import { ChainId } from '@aave/contract-helpers';

export const APP_CHAIN_ID = ChainId.avalanche

class Token { 
    constructor(
        public chainId: ChainId,
        public address: string, 
        public decimals: number, 
        public symbol: string, 
        public name: string,
        public reserveLiquidationThreshold: string,
        public reserveLiquidationBonus: string,
        public eModeLiquidationThreshold: number,
        public eModeLiquidationBonus: number,
        public priceOracle: string
    ){};
}
// const arry :{[index: string]:any} = {}
const token_list_avalanche :{[index: string]:any} = 
{
    "0xd586e7f844cea2f87f50152665bcbc2c279d8d70": new Token( ChainId.avalanche, "0xd586e7f844cea2f87f50152665bcbc2c279d8d70", 18, "DAI.e", "", "8000", "10500", 9750, 10100, "0x51D7180edA2260cc4F6e4EebB82FEF5c3c2B8300"),
 
    "0x5947bb275c521040051d82396192181b413227a3": new Token( ChainId.avalanche, "0x5947bb275c521040051d82396192181b413227a3", 18, "LINK.e", "", "6500", "10750", 0, 0, "0x49ccd9ca821EfEab2b98c60dC60F518E765EDe9a"),
   
    "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e": new Token( ChainId.avalanche, "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e", 6, "USDC", "", "8500", "10400", 9750, 10100, "0xF096872672F44d6EBA71458D74fe67F9a77a23B9"),
 
    "0x50b7545627a5162f82a992c33b87adc75187b218": new Token( ChainId.avalanche, "0x50b7545627a5162f82a992c33b87adc75187b218", 8, "WBTC.e", "", "7500", "10650", 0, 0, "0x2779D32d5166BAaa2B2b658333bA7e6Ec0C65743"),

    "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab": new Token( ChainId.avalanche, "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab", 18, "WETH.e", "", "8250", "10500", 0, 0, "0x976B3D034E162d8bD72D6b9C989d545b839003b0"),
  
    "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7": new Token( ChainId.avalanche, "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7", 6, "USDt", "", "8000", "10500", 9750, 10100, "0xEBE676ee90Fe1112671f19b6B7459bC678B67e8a"),
  
    "0x63a72806098bd3d9520cc43356dd78afe5d386d9": new Token( ChainId.avalanche, "0x63a72806098bd3d9520cc43356dd78afe5d386d9", 18, "AAVE.e", "", "7000", "10705", 0, 0, "0x3CA13391E9fb38a75330fb28f8cc2eB3D9ceceED"),

    "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7": new Token( ChainId.avalanche, "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7", 18, "WAVAX", "" ,"7000", "11000", 0, 0, "0x0A77230d17318075983913bC2145DB16C7366156"),
 
}
const token_list = 
{
    [ChainId.avalanche] : token_list_avalanche,
}

export const TOKEN_LIST = token_list[APP_CHAIN_ID]

// console.log(TOKEN_LIST["0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab"].symbol)