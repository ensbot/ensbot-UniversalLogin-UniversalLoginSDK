import {createFixtureLoader} from 'ethereum-waffle';
import {prerequisites} from '../fixtures/prerequisites';
import {DeepPartial, ETHER_NATIVE_TOKEN, withENS} from '@universal-login/commons';
import {providers} from 'ethers';
import {Config, getContractWhiteList, RelayerUnderTest} from '@universal-login/relayer';

const loadFixture = createFixtureLoader();

const PORT = '55111';

export async function setupTestEnvironment() {
  const {
    deployer,
    walletContract,
    factoryContract,
    ensAddress,
    ensDomains,
    mockToken,
    wallets,
    ensRegistrar,
  } = await loadFixture(prerequisites);

  const providerWithENS = withENS(deployer.provider as providers.Web3Provider, ensAddress);

  const contractWhiteList = getContractWhiteList();
  const supportedTokens = [
    {
      address: mockToken.address,
      minimalAmount: '0.05',
    },
    {
      address: ETHER_NATIVE_TOKEN.address,
      minimalAmount: '0.05',
    },
  ];
  const overrideConfig: DeepPartial<Config> = {
    port: PORT,
    privateKey: deployer.privateKey,
    chainSpec: {
      ensAddress,
    },
    ensRegistrar: ensRegistrar.address,
    ensRegistrars: ensDomains,
    walletContractAddress: walletContract.address,
    contractWhiteList,
    factoryAddress: factoryContract.address,
    supportedTokens,
  };
  const relayer = RelayerUnderTest.createTestRelayer(overrideConfig, providerWithENS);
  await relayer.start();

  return {relayer, provider: providerWithENS, deployer, wallets};
}
