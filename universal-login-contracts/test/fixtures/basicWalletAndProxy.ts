import {Contract, providers, Wallet} from 'ethers';
import {deployContract} from 'ethereum-waffle';
import MockWalletMaster from '../../dist/contracts/MockWalletMaster.json';
import ProxyContract from '../../dist/contracts/WalletProxy.json';

export default async function basicWalletAndProxy(givenProvider: providers.Provider, [, , wallet]: Wallet[]) {
  const walletContract = await deployContract(wallet, MockWalletMaster);
  const walletProxy = await deployContract(wallet, ProxyContract, [walletContract.address]);
  const proxyAsWallet = new Contract(walletProxy.address, MockWalletMaster.abi, wallet);
  return {provider: givenProvider, walletContract, walletProxy, proxyAsWallet, wallet};
}
