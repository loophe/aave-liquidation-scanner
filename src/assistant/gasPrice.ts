import { ethers } from 'ethers'
// import { provider } from "./provider";
// type providerWs = ethers.providers.Provider

export function gasPrice (providerWs: ethers.providers.WebSocketProvider ) { 
  
  
    providerWs.on("pending", async (tx: any) => {
        const transaction = await providerWs.getTransaction(tx)
        const botAddress = '0x794a61358D6845594F94dc1DB02A252b5b4814aD'
        if 
        (             
            transaction != null &&
            transaction.to != null &&     
            transaction.to == botAddress         
        )
        {            
            var gasPrice: number = transaction.gasPrice.toNumber()
            var gasPrinceInGwei:number = gasPrice / 10**9
            console.log(`To bot gasPrice : ${gasPrinceInGwei}`);
            
            return gasPrice
            // console.log(transaction)
        }   
    });

    providerWs._websocket.on("error", async () => {
        console.log(`Unable to connect to moris retrying in 3s...`);
        setTimeout(gasPrice, 3000);
    });
    providerWs._websocket.on("close", async (code: any) => {
        console.log(
        `Connection lost with code ${code}! Attempting reconnect in 3s...`
        );
        providerWs._websocket.terminate();
        setTimeout(gasPrice, 3000);
    });
};

// gasPrice(provider);