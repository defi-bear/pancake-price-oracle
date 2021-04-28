import { Crypto } from '@peculiar/webcrypto'
;(global as any).crypto = new Crypto()
import * as OracleSdk from '@keydonix/uniswap-oracle-sdk'
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js'
import { PriceEmitter } from './generated/price-emitter'
import { FetchDependencies } from '@zoltu/solidity-typescript-generator-fetch-dependencies';
import { createMnemonicRpc } from './rpc-factories'
import { ethGetBlockByNumber } from './adapters';
import abi from './aggregatorABI.json';

async function main() {
	const gasPrice = 10n**9n
	console.log('gasPrice', gasPrice)
	const rpc = await createMnemonicRpc('https://bsc-dataseed.binance.org/', gasPrice)
	//const rpcSignerAddress = await rpc.addressProvider()
	const dependencies = new FetchDependencies(rpc);
	// console.log(dependencies);
	const url = "https://bsc-dataseed.binance.org/";

	const addr = '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE'; //bnb-usd
	const contract = new ethers.Contract(addr, abi, new ethers.providers.JsonRpcProvider(url));
	await contract.latestRoundData()
		.then(async (roundData: any) => {
			console.log('BNB Price', new BigNumber(roundData.answer._hex).div(new BigNumber(10).pow(8)).toFixed(3))
			const bnbPrice = new BigNumber(roundData.answer._hex).div(new BigNumber(10).pow(8));
			//uniswapExchange = 0x3da30727ed0626b78c212e81b37b97a8ef8a25bb
			//token0 = 0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c
			//token1 = 0xe02df9e3e622debdd69fb838bb799e3f168902c5
			//priceEmitter = 0xF27A485d60cd5317cA8eeA6FE776b298fc7e3010
			const uniswapExchange = 0x3da30727ed0626b78c212e81b37b97a8ef8a25bbn;
			const token0 = 0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095cn;
			//const token1 = "0xe02df9e3e622debdd69fb838bb799e3f168902c5";
			const priceEmitter = new PriceEmitter(dependencies, 0xF27A485d60cd5317cA8eeA6FE776b298fc7e3010n);
			//const { uniswapExchange, priceEmitter, token0, token1 } = await deployAllTheThings(rpc)

			const blockNumber = (await rpc.getBlockNumber()) - (10n); // Grab the first block after the sync is called, new blocks will be at 1:1 ratio from here

			// get the proof from the SDK
			const proof = await OracleSdk.getProof(rpc.getStorageAt, rpc.getProof, ethGetBlockByNumber.bind(undefined, rpc), uniswapExchange, token0, blockNumber)

			// call our contract with the proof and inspect the price it witnessed
			const events = await priceEmitter.getPrice_(uniswapExchange, token0, 4n, 20n, proof);
			console.log(events);
			//const contractPrice = (events.find(x => x.name === 'Price') as PriceEmitter.Price).parameters.price
			// Uniswap oracle prices are binary fixed point numbers with 112 fractional bits, so we convert to floating point here (may suffer rounding errors, use with caution in production)
			//console.log(`Contract Price: ${Number(contractPrice) / 2**112}`)

			// ask the SDK for a price estimate as of the latest block, which should match what the SDK said (since it executed in the latest block)
			const sdkPrice = await OracleSdk.getPrice(rpc.getStorageAt, ethGetBlockByNumber.bind(undefined, rpc), uniswapExchange, token0, blockNumber);
			console.log(sdkPrice);
			console.log(`BAKE Price: ${new BigNumber(Number(sdkPrice) / 2**112).times(bnbPrice).toFixed(3)}`)
		})
}

main().then(() => {
	process.exit(0)
}).catch(error => {
	console.dir(error, { depth: null })
	process.exit(1)
})
