import React from 'react';
import {Provider, JsonRPCResponse, Callback} from 'web3/providers';
import {render} from 'react-dom';
import {Web3PickerComponent} from './Web3PickerComponent';
import {State} from 'reactive-properties';
import {ensure, ensureNotFalsy} from '@universal-login/commons';
import {waitForFalse} from '../utils/utils';
import {Web3ProviderFactory} from '../../models/Web3ProviderFactory';
import {Web3Strategy} from '../../Web3Strategy';
import {JsonRPCRequest} from '../../models/rpc';
import {InvalidProvider} from '../utils/errors';
import {createReactRoot} from '../utils/initUi';

export class Web3Picker implements Provider {
  private isVisible = new State(false);
  private created = false;

  constructor(
    private web3Strategy: Web3Strategy,
    private readonly factories: Web3ProviderFactory[],
  ) {}

  private hasProvider = (providerName: string) => this.factories.some(({name}) => name === providerName);

  async setProvider(providerName: string) {
    ensure(this.hasProvider(providerName), InvalidProvider, providerName);
    this.web3Strategy.currentProvider = await this.getFactory(providerName).create();
    this.web3Strategy.providerName = providerName;
    this.web3Strategy.readProvider = this.web3Strategy.currentProvider;
    this.isVisible.set(false);
  }

  private getFactory(providerName: string): Web3ProviderFactory {
    const factory = this.findFactory(providerName);
    ensureNotFalsy(factory, InvalidProvider, providerName);
    return factory;
  }

  private findFactory = (name: string) => this.factories.find((factory) => factory.name === name);

  private lazyCreateReactRoot() {
    if (!this.created) {
      this.created = true;
      const root = createReactRoot('universal-login-web3-picker');
      render(
        <Web3PickerComponent
          isVisibleProp={this.isVisible}
          hideModal={() => this.hideChooser()}
          setProvider={this.setProvider.bind(this)}
          factories={this.factories}
        />, root);
    }
  }

  private hideChooser() {
    this.isVisible.set(false);
  }

  show() {
    this.lazyCreateReactRoot();
    this.isVisible.set(true);
    return {
      waitForPick: () => waitForFalse(this.isVisible),
    };
  }

  async send(jsonRpcReq: JsonRPCRequest, callback: Callback<JsonRPCResponse>) {
    if (this.isVisible.get()) {
      return;
    }
    if (jsonRpcReq.method === 'eth_accounts') {
      return callback(null, {
        jsonrpc: jsonRpcReq.jsonrpc,
        id: jsonRpcReq.id,
        result: [],
      });
    }
    const {waitForPick} = this.show();
    await waitForPick();
    return this.web3Strategy.currentProvider.send(jsonRpcReq, callback);
  }
}
