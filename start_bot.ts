import { ethers } from 'ethers';
import { executeScanner } from './executeScanner_avalanche';
import 'dotenv/config';

type KeepAliveParams = {
    provider: ethers.providers.WebSocketProvider;
    onDisconnect: (err: any) => void;
    expectedPongBack?: number;
    checkInterval?: number;
};
  
const keepAlive = ({

    provider,
    onDisconnect,
    expectedPongBack = 15000,
    checkInterval = 7500

}: KeepAliveParams) => {

    let pingTimeout: NodeJS.Timeout | null = null;
    let keepAliveInterval: NodeJS.Timeout | null = null;

    provider._websocket.on('open', async () => {
        keepAliveInterval = setInterval(() => {
        provider._websocket.ping();

        // Use `WebSocket#terminate()`, which immediately destroys the connection,
        // instead of `WebSocket#close()`, which waits for the close timer.
        // Delay should be equal to the interval at which your server
        // sends out pings plus a conservative assumption of the latency.
        pingTimeout = setTimeout(() => {
            provider._websocket.terminate();
        }, expectedPongBack);
        }, checkInterval);

        while( true ){
        executeScanner(provider);
        await sleep(600_000);
        } 

    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider._websocket.on('close', (err: any) => {
        if (keepAliveInterval) clearInterval(keepAliveInterval);
        if (pingTimeout) clearTimeout(pingTimeout);
        onDisconnect(err);
    });

    provider._websocket.on('pong', () => {
        if (pingTimeout) clearInterval(pingTimeout);
    });

};
  
  
  
  
const startBot = () => {

    const moralis_key = process.env.MORALIS_KEY
    const wsUrl = `wss://speedy-nodes-nyc.moralis.io/${moralis_key}/avalanche/mainnet/ws`
    const provider = new ethers.providers.WebSocketProvider(wsUrl);

    keepAlive({
        provider,
        onDisconnect: (err) => {
            startBot();
            console.error('The ws connection was closed', JSON.stringify(err, null, 2));
        },
        
    });
};


function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
  
  
startBot()