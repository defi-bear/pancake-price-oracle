pragma solidity 0.6.8;
pragma experimental ABIEncoderV2;

import { PancakeswapOracle } from "./PancakeswapOracle.sol";
import { IPancakeswapPair } from "./IPancakeswapPair.sol";

contract PriceEmitter is PancakeswapOracle {
	event Price(uint256 price);

	function emitPrice(IPancakeswapPair exchange, address denominationToken, uint8 minBlocksBack, uint8 maxBlocksBack, PancakeswapOracle.ProofData memory proofData) public returns (uint256 price, uint256 blockNumber) {
		(price, blockNumber) = getPrice(exchange, denominationToken, minBlocksBack, maxBlocksBack, proofData);
		emit Price(price);
	}
}
