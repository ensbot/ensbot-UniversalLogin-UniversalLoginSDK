import {expect} from 'chai';
import {Wallet} from 'ethers';
import {createMockProvider, getWallets} from 'ethereum-waffle';
import {TEST_GAS_PRICE, createKeyPair, signRelayerRequest, TEST_PRIVATE_KEY, recoverFromRelayerRequest, ETHER_NATIVE_TOKEN, EMPTY_DEVICE_INFO} from '@universal-login/commons';
import RelayerRequestSignatureValidator from '../../../src/integration/ethereum/validators/RelayerRequestSignatureValidator';
import setupWalletService, {createFutureWallet} from '../../testhelpers/setupWalletService';
import createGnosisSafeContract from '../../testhelpers/createGnosisSafeContract';
import {Beta2Service} from '../../../src/integration/ethereum/Beta2Service';
import {BlockchainService, signStringMessage, calculateGnosisStringHash} from '@universal-login/contracts';
import {GnosisSafeService} from '../../../src/integration/ethereum/GnosisSafeService';
import {WalletContractService} from '../../../src/integration/ethereum/WalletContractService';

describe('INT: RelayerRequestSignatureValidator', () => {
  let relayerRequestSignatureValidator: RelayerRequestSignatureValidator;
  let wallet: Wallet;
  let provider;
  let contractAddress: string;
  const keyPair = createKeyPair();
  const ensName = 'jarek.mylogin.eth';

  beforeEach(async () => {
    provider = createMockProvider();
    [wallet] = await getWallets(provider);
    const beta2Service = new Beta2Service(provider);
    const blockchainService = new BlockchainService(provider);
    const gnosisSafeService = new GnosisSafeService(provider);
    const walletContractService = new WalletContractService(blockchainService, beta2Service, gnosisSafeService);
    const {walletService, factoryContract, ensService} = await setupWalletService(wallet);
    relayerRequestSignatureValidator = new RelayerRequestSignatureValidator(walletContractService);
    const {futureContractAddress, signature} = await createFutureWallet(keyPair, ensName, factoryContract, wallet, ensService);
    await walletService.deploy({publicKey: keyPair.publicKey, ensName, gasPrice: TEST_GAS_PRICE, signature, gasToken: ETHER_NATIVE_TOKEN.address}, EMPTY_DEVICE_INFO);
    contractAddress = futureContractAddress;
  });

  it('do not throw exception', async () => {
    await expect(relayerRequestSignatureValidator.ensureValidRelayerRequestSignature(signRelayerRequest({contractAddress}, keyPair.privateKey))).to.be.fulfilled;
  });

  it('throw exception', async () => {
    const relayerRequest = signRelayerRequest({contractAddress}, TEST_PRIVATE_KEY);
    await expect(relayerRequestSignatureValidator.ensureValidRelayerRequestSignature(relayerRequest)).to.be.rejectedWith(`Unauthorised address: ${recoverFromRelayerRequest(relayerRequest)}`);
  });

  it('validation works for GnosisSafe', async () => {
    const {proxy, keyPair} = await createGnosisSafeContract(wallet);
    const msgHash = calculateGnosisStringHash(proxy.address, proxy.address);
    const signature = signStringMessage(msgHash, keyPair.privateKey);
    await expect(relayerRequestSignatureValidator.ensureValidRelayerRequestSignature({signature, contractAddress: proxy.address})).to.be.fulfilled;
  });
});