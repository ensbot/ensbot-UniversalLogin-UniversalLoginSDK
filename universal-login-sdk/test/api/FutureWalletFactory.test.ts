import chai, {expect} from 'chai';
import chaiHttp from 'chai-http';
import {utils, Wallet, providers, Contract} from 'ethers';
import {createMockProvider, getWallets} from 'ethereum-waffle';
import {ETHER_NATIVE_TOKEN, ContractWhiteList, getDeployedBytecode, SupportedToken, ContractJSON, TEST_GAS_PRICE, TEST_APPLICATION_INFO} from '@universal-login/commons';
import {BlockchainService, gnosisSafe} from '@universal-login/contracts';
import {RelayerUnderTest} from '@universal-login/relayer';
import {FutureWalletFactory} from '../../src/api/FutureWalletFactory';
import {RelayerApi} from '../../src/integration/http/RelayerApi';
import {ENSService} from '../../src/integration/ethereum/ENSService';

chai.use(chaiHttp);

describe('INT: FutureWalletFactory', async () => {
  let provider: providers.Provider;
  let wallet: Wallet;
  let futureWalletFactory: FutureWalletFactory;
  let relayer: RelayerUnderTest;
  let factoryContract: Contract;
  let ensRegistrar: Contract;
  let walletContract: Contract;
  let supportedTokens: SupportedToken[];
  let contractWhiteList: ContractWhiteList;
  let ensAddress: string;
  const relayerPort = '33511';
  const relayerUrl = `http://localhost:${relayerPort}`;

  before(async () => {
    provider = createMockProvider();
    [wallet] = getWallets(provider);
    ({relayer, factoryContract, supportedTokens, contractWhiteList, provider, ensAddress, ensRegistrar, walletContract} = await RelayerUnderTest.createPreconfigured(wallet, relayerPort));
    await relayer.start();
    const futureWalletConfig = {
      factoryAddress: factoryContract.address,
      walletContractAddress: walletContract.address,
      supportedTokens,
      relayerAddress: wallet.address,
      contractWhiteList,
      chainSpec: {
        ensAddress,
        chainId: 0,
        name: '',
      },
    };
    const blockchainService = new BlockchainService(provider);
    const relayerApi = new RelayerApi(relayerUrl);
    futureWalletFactory = new FutureWalletFactory(
      futureWalletConfig,
      new ENSService(provider, futureWalletConfig.chainSpec.ensAddress, ensRegistrar.address),
      blockchainService,
      {sdkConfig: {applicationInfo: TEST_APPLICATION_INFO}, provider, relayerApi} as any,
    );
  });

  it('deploy contract', async () => {
    const ensName = 'name.mylogin.eth';
    const {waitForBalance, contractAddress, deploy} = (await futureWalletFactory.createNew(ensName, TEST_GAS_PRICE, ETHER_NATIVE_TOKEN.address));
    await wallet.sendTransaction({to: contractAddress, value: utils.parseEther('1')});
    const result = await waitForBalance();
    expect(result.contractAddress).be.eq(contractAddress);
    expect(result.tokenAddress).be.eq(ETHER_NATIVE_TOKEN.address);
    await wallet.sendTransaction({to: contractAddress, value: utils.parseEther('2')});
    const {waitToBeSuccess, deploymentHash} = await deploy();
    expect(deploymentHash).to.be.properHex(64);
    const deployedWallet = await waitToBeSuccess();
    expect(await provider.getCode(contractAddress)).to.be.eq(`0x${getDeployedBytecode(gnosisSafe.Proxy as ContractJSON)}`);

    expect(deployedWallet.contractAddress).to.eq(contractAddress);
    expect(deployedWallet.name).to.eq(ensName);
  });

  it('should reject uppercase ens name, before sending the transaction to the blockchain', async () => {
    const ensName = 'MYNAME.mylogin.eth';
    const {waitForBalance, contractAddress, deploy} = (await futureWalletFactory.createNew(ensName, TEST_GAS_PRICE, ETHER_NATIVE_TOKEN.address));
    await wallet.sendTransaction({to: contractAddress, value: utils.parseEther('2')});
    await waitForBalance();

    const balanceBefore = await wallet.getBalance();
    await expect(deploy())
      .to.be.eventually.rejectedWith('MYNAME.mylogin.eth is not valid');
    const balanceAfter = await wallet.getBalance();
    expect(balanceBefore).to.be.equal(balanceAfter);
  });

  after(async () => {
    await relayer.stop();
  });
});
