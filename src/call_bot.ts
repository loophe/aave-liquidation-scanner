import { ethers, Wallet, BigNumber } from 'ethers';
import { TOKEN_LIST } from './constants/tokenIndex';
import { provider } from './provider/provider'
import { userReserves } from './userReserve_avalanche';
import { gasPrice } from './assistant/gasPrice';
import liquidatorABI from './constants/liquidatorABI.json';
import getPairABI from './constants/joeFactory.json';
// import joePairABI from './constants/joePair.json';
import wavaxABI from './constants/wavax.json';
import 'dotenv/config';


export async function callContract(provider: ethers.providers.WebSocketProvider, user_address: string){
    
    // const wallet = new Wallet(process.env.PRIVATE_KEY1)
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY1)
    const signer = wallet.connect(provider)
    const liqAddress = '0x149A39367F970c17A5b12fE1c528fbe9fbF6f54c'
    const joeFactoryAddress = '0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10'
    const wavaxAddress = "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7"//wavax
    const wavaxPriceOracleAddress = TOKEN_LIST[wavaxAddress].priceOracle
    const user = user_address      
    const aToken = false   

    const joeFactory = new ethers.Contract(
        joeFactoryAddress,
        getPairABI,
        provider
    )

    const liqContract = new ethers.Contract(
        liqAddress,
        liquidatorABI,
        provider,

    )

    const wavaxContract = new ethers.Contract(
        wavaxAddress,
        wavaxABI,
        provider
    ) 

    const priceOracleContract = new ethers.Contract(
        wavaxPriceOracleAddress,
        ['function latestRoundData() external view returns (uint80 roundId,int256 answer,uint256 startedAt,uint256 updatedAt,uint80 answeredInRound)'],
        provider
    )    
  
    const result = await userReserves( user_address, provider )
  
    if 
    ( result.max_collacteral != '0x' &&
      result.max_collacteralAmount != 1 &&
      result.max_reserve != '0x' &&
      result.max_reserveAmount != 1
    ) { 
  
        const collacteral = result.max_collacteral
        const reserve = result.max_reserve
        // const symbol = TOKEN_LIST[reserve].symbol
        // console.log(symbol)
        const amount = result.max_reserveBalance.toString()
        // result.max_collacteralAmount > result.max_reserveAmount ?
        // result.max_reserveBalance : result.max_collacteralBalance  
        // console.log(result)      

        const target = await joeFactory.getPair(wavaxAddress,reserve)

        const amountInBase = 
        result.max_collacteralAmount > result.max_reserveAmount ?
        result.max_reserveAmount : result.max_collacteralAmount
        const priceRes = await priceOracleContract.latestRoundData()  
        const priceInBase = priceRes[1].toString()
        const balw = await wavaxContract.balanceOf(liqAddress)
        const balr = balw * priceInBase / 10 ** 18
        const isFlashloan = balr >= (amountInBase * 10**8) ? false : true 

        const transaction = await liqContract.populateTransaction.swapAndLiq( target, collacteral, reserve, user, amount, isFlashloan, aToken,{
            // gasPrice: BigNumber.from(20),
            gasLimit: BigNumber.from(1000000),
        })
      
        try{    
            const estimateGas = await provider.estimateGas({
                ...transaction,
                from: wallet.address
            })
            if (estimateGas.gt(1400000)) {
                console.log("EstimateGas succeeded, but suspiciously large: " + estimateGas.toString())
                // continue
              }
            transaction.gasLimit = estimateGas.mul(2)

            // transaction.gasPrice = BigNumber.from(265*10**8)
            console.log(`Transaction gas_limit : ${estimateGas.toString()}`)           
            // let gasPending = gasPrice(provider)
            // if ( gasPending > gasNormal.toNumber())


        }catch(e){
            console.error(e.reason, e.code)
        }

        // let gasNormal = await provider.getGasPrice()
        let n = await provider.getBlockNumber()
        let gasTransction = await provider.getBlockWithTransactions(n)
        let transactionArr = gasTransction.transactions
        let max_gas:number = 25
        transactionArr.forEach((transaction,i)=>{
            if (transaction.gasPrice.toNumber() > max_gas){
                max_gas= transaction.gasPrice.toNumber()
            }
        })
        // console.log(`Normal gas : ${gasNormal.toNumber()/(10**9)}`)
        // console.log(`Latest block max_gas : ${max_gas/(10**9)} `)
        // transaction.gasPrice = gasNormal.toNumber() > max_gas ? gasNormal : BigNumber.from(max_gas)
        transaction.gasPrice = BigNumber.from(max_gas)
        console.log(`Transaction gas : ${transaction.gasPrice.toNumber()/(10**9)}`)
        // console.log(transaction)
        const signedTx = await signer.sendTransaction(transaction)
        console.log(signedTx.hash)
        const tokenContract = new ethers.Contract(
            collacteral,
            wavaxABI,
            signer
            )
        const bale = await tokenContract.balanceOf(liqAddress)
        const decimals = await tokenContract.decimals()
        console.log(bale.toString()/10**decimals)
    }
}
//      const user = '0x2452F72ECd3e0554Fb7D555a5A1b947d7641cc05'  
// callContract(provider, user)