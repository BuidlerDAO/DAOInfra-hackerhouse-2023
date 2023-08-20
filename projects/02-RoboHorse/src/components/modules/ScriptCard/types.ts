import { TNFTBalance } from 'components/templates/balances/xNFT/types';

export interface INFTCard
  extends Pick<TNFTBalance, 'amount' | 'contractType' | 'name' | 'symbol' | 'tokenAddress' | 'tokenId' | 'metadata'> {}
