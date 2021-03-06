import {providers, Contract, utils} from 'ethers';
import {calculateMessageHash, SignedMessage, RelayerRequest, hashRelayerRequest, recoverFromRelayerRequest} from '@universal-login/commons';
import {WalletContractInterface} from '@universal-login/contracts';
import {getKeyFromHashAndSignature, isAddKeyCall, isAddKeysCall, isRemoveKeyCall, decodeParametersFromData} from '../../core/utils/encodeData';
import IWalletContractService from '../../core/models/IWalletContractService';
import {beta2} from '@universal-login/contracts';
import {messageToTransaction, decodeDataForExecuteSigned} from '../../core/utils/messages/serialisation';

export class Beta2Service implements IWalletContractService {
  constructor(private provider: providers.Provider) {
  }

  async getRequiredSignatures(walletAddress: string): Promise<utils.BigNumber> {
    const walletContract = new Contract(walletAddress, WalletContractInterface, this.provider);
    const requiredSignatures = await walletContract.requiredSignatures();
    return requiredSignatures;
  }

  async keyExist(walletAddress: string, key: string) {
    const walletContract = new Contract(walletAddress, WalletContractInterface, this.provider);
    return walletContract.keyExist(key);
  }

  calculateMessageHash(message: SignedMessage) {
    return calculateMessageHash(message);
  }

  recoverSignerFromMessage(message: SignedMessage) {
    return getKeyFromHashAndSignature(
      this.calculateMessageHash(message),
      message.signature,
    );
  }

  fetchMasterAddress(walletAddress: string): Promise<string> {
    const walletProxy = new Contract(walletAddress, beta2.WalletProxy.interface, this.provider);
    return walletProxy.implementation();
  }

  async isValidSignature(message: string, walletAddress: string, signature: string) {
    const contract = new Contract(walletAddress, beta2.WalletContract.interface as any, this.provider);
    return contract.isValidSignature(message, signature);
  }

  getRelayerRequestMessage(relayerRequest: RelayerRequest) {
    return hashRelayerRequest(relayerRequest);
  }

  async recoverFromRelayerRequest(relayerRequest: RelayerRequest) {
    return recoverFromRelayerRequest(relayerRequest);
  }

  messageToTransaction(message: SignedMessage) {
    return messageToTransaction(message);
  }

  isAddKeyCall(data: string) {
    return isAddKeyCall(data);
  }

  isAddKeysCall(data: string) {
    return isAddKeysCall(data);
  }

  isRemoveKeyCall(data: string) {
    return isRemoveKeyCall(data);
  }

  decodeKeyFromData(data: string) {
    return decodeParametersFromData(data, ['address']);
  }

  decodeKeysFromData(data: string) {
    return decodeParametersFromData(data, ['address[]']);
  }

  decodeExecute(data: string) {
    return decodeDataForExecuteSigned(data);
  }

  isValidMessageHash(messageHash: string, signedMessage: SignedMessage) {
    const calculatedMessageHash = this.calculateMessageHash(signedMessage);
    return messageHash === calculatedMessageHash;
  }
}
