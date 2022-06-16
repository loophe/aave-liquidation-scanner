import { ethers, Wallet } from 'ethers';
// import { provider } from './provider'
import { provider } from './providerHttp'
import { TOKEN_LIST } from './constants/index';
import liquidatorABI from './constants/liquidatorABI.json';
import getPairABI from './constants/joeFactory.json';
import 'dotenv/config';


async function gas(){

    // const httpUrl = `wss://speedy-nodes-nyc.moralis.io/ceb76aaef10a3189d34c16d5/avalanche/mainnet/ws`
    // const provider = new ethers.providers.WebSocketProvider (httpUrl)
    const signer = new Wallet(process.env.PRIVATE_KEY1)  
    const liqAddress = '0x149A39367F970c17A5b12fE1c528fbe9fbF6f54c'
    const joeFactoryAddress = '0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10'

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

    const collacteral = '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB'//weth
    const reserve = "0xd586e7f844cea2f87f50152665bcbc2c279d8d70"//dai
    const wavax = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"//wavax
    const user = '0x2452F72ECd3e0554Fb7D555a5A1b947d7641cc05'  
    const aToken = true
    const isFlashloan =false
    const decimals = TOKEN_LIST[reserve].decimals
    const amount = (27 * 10 ** decimals).toString()  
    const target = await joeFactory.getPair(wavax,reserve) 
    const transaction = await liqContract.populateTransaction.swapAndLiq( target, collacteral, reserve, user, amount, isFlashloan, aToken)
    // console.log(transaction)
    const estimateGas = await provider.estimateGas({
        ...transaction,
        from: signer.address
    })
    console.log(estimateGas.toString())
    
}

gas()