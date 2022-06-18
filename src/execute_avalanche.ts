import { ethers } from 'ethers';
import * as fs from "fs";
import * as path from "path";
import { userReserves } from './userReserve_avalanche';
import { scanner } from './scanners/aave_scanner_avalanche';
import { callContract } from './call_bot'




async function writeResult ( address :string, provider: ethers.providers.Provider) {

  const result = await userReserves( address, provider)
  const accounts : any [] = []
  const accountsIndex = {
    "nextId" :1,
    "accounts": accounts
  }

  if 
  ( result.max_collacteral != '0x' &&
    result.max_collacteralAmount != 1 &&
    result.max_reserve != '0x' &&
    result.max_reserveAmount != 1
  ) {

    const time = new Date()

    const userResult = {
      "time": time,
      "user_id": address,
      "value": result,    
    }

    var content = JSON.stringify(userResult)

    fs.readFile(path.join(__dirname, 'accounts',`index.json`), async (err, data) => {
      if ( data == null ){    
        accountsIndex.nextId = 2  
        accounts.push(address) 
        accountsIndex.accounts = accounts
        const index = JSON.stringify(accountsIndex)    
        fs.writeFile(path.join(__dirname, `accounts/index.json`) , index, err => {
          if (err) {
            console.error(err)
            return
          }
        })
        fs.writeFile(path.join(__dirname, `accounts/account1.json`), content, err => {
          if (err) {
          console.error(err)
          return
          } 
        })
      }else{
        const dataJ = JSON.parse(data.toString());
       
        let arr = dataJ.accounts
        // console.log(arr)
        let isAdded = IsInArray( arr, address )
        if ( !isAdded) {//Dont add same account again and again
          let n = dataJ.nextId
          arr.push(address)
          accountsIndex.nextId = n+1
          accountsIndex.accounts = arr
          let index = JSON.stringify(accountsIndex)  
          fs.writeFile( path.join( __dirname,`accounts/index.json`) , index , err => {
            if (err) {
              console.error(err)
              return
            }
          })
      
          fs.writeFile(path.join(__dirname, `accounts/account${n}.json`), content, err => {
            if (err) {
            console.error(err)
            return
            }
            //file written successfully
          })
        }       
      }
    })
  }
}



export async function execute(provider: ethers.providers.WebSocketProvider) {

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
    
        console.log("No borrowings account!")
      }else{
        console.log(accountHealthy,address)
        if ( accountHealthy < 1 )  {
          await callContract(provider, address)
          await writeResult( address, provider )
        }
        
      }      
    }
  
    console.log(`\nTask finished on `, Date().toLocaleString())  

  }) 

}


function IsInArray(arr: any[],val: string){
  var testStr=','+arr.join(",")+",";
  return testStr.indexOf(","+val+",")!=-1;
}

