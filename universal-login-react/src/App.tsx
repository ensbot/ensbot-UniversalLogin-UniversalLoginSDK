import React, {useState} from 'react';
import {BrowserRouter, Route, Switch, Link} from 'react-router-dom';
import {NavigationColumn} from './ui/commons/NavigationColumn';
import {WalletSelector} from './ui/WalletSelector/WalletSelector';
import {EmojiForm} from './ui/Notifications/EmojiForm';
import {generateCode, TEST_CONTRACT_ADDRESS, TEST_PRIVATE_KEY, TEST_ACCOUNT_ADDRESS, TEST_MESSAGE_HASH, TEST_TRANSACTION_HASH} from '@universal-login/commons';
import {EmojiPanel} from './ui/WalletSelector/EmojiPanel';
import {Settings} from './ui/Settings/Settings';
import {Onboarding} from './ui/Onboarding/Onboarding';
import {useServices} from './core/services/useServices';
import {LogoButton} from './ui/UFlow/LogoButton';
import {CreateRandomInstance} from './ui/commons/CreateRandomInstance';
import './ui/styles/playground.css';
import {DeployedWallet, DeployingWallet} from '@universal-login/sdk';
import {Spinner} from './ui/commons/Spinner';
import {useAsync} from './ui/hooks/useAsync';
import {WalletService} from '@universal-login/sdk';
import {mockNotifications, CONNECTION_REAL_ADDRESS} from './ui/PlaygroundUtils/mockNotifications';
import {ModalWrapper} from './ui/Modals/ModalWrapper';
import {WaitingForOnRampProvider} from './ui/TopUp/Fiat/WaitingForOnRampProvider';
import {TopUp} from './ui/TopUp/TopUp';
import {WaitingForTransaction} from './ui/commons/WaitingForTransaction';
import {ThemesPlayground} from './ui/Playground/ThemesPlayground';
import {ThemeProvider} from './ui/themes/Theme';

export const App = () => {
  const {sdk} = useServices();
  const [relayerConfig] = useAsync(async () => {
    await sdk.fetchRelayerConfig();
    return sdk.getRelayerConfig();
  }, []);

  const [walletService] = useState(() => new WalletService(sdk));

  const name = 'test.mylogin.eth';

  const deployingWallet = new DeployingWallet({
    contractAddress: TEST_ACCOUNT_ADDRESS,
    name,
    privateKey: TEST_PRIVATE_KEY,
    deploymentHash: TEST_MESSAGE_HASH,
  }, sdk);

  const futureWallet = {
    contractAddress: TEST_ACCOUNT_ADDRESS,
    privateKey: TEST_PRIVATE_KEY,
    deploy: async () => deployingWallet,
    waitForBalance: (async () => {}) as any,
    setSupportedToken: (() => {}) as any,
  } as any;

  async function tryEnablingMetamask() {
    const ethereum = (window as any).ethereum;
    if (ethereum) {
      try {
        await ethereum.enable();

        return ethereum.selectedAddress;
      } catch (error) {
      }
    }
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <div className="playground">
          <NavigationColumn />
          <div className="playground-content">
            <Switch>
              <Route exact path="/" render={() => (<p>Welcome to Universal Login</p>)} />
              <Route exact path="/themes" render={() => <ThemesPlayground />} />
              <Route exact path="/logoButton">
                <div>
                  <button onClick={() => mockNotifications(sdk)}>Create mock notifications</button>
                  <hr />
                  <CreateRandomInstance walletService={walletService} />
                  <hr />
                  <LogoButton walletService={walletService} />
                </div>
              </Route>
              <Route
                exact
                path="/onboarding/success"
                render={({history}) => <>
                  <div> Success!!! </div>
                  <br />
                  <button onClick={() => {
                    walletService.disconnect();
                    history.push('/onboarding');
                  }}>Disconnect</button>
                </>}
              />
              <Route
                exact
                path="/onboarding"
                render={({history}) =>
                  <Onboarding
                    sdk={sdk}
                    walletService={walletService}
                    domains={['mylogin.eth', 'universal-id.eth']}
                    tryEnablingMetamask={tryEnablingMetamask}
                    onConnect={() => console.log('connected')}
                    onCreate={() => history.push('/onboarding/success')}
                  />}
              />
              <Route exact path="/walletSelector">
                <WalletSelector
                  onCreateClick={() => {console.log('create');}}
                  onConnectClick={() => {console.log('connect');}}
                  sdk={sdk}
                  domains={['mylogin.eth', 'myapp.eth']}
                />
              </Route>
              <Route
                exact
                path="/keyboard"
                render={() => {
                  return relayerConfig ? (
                    <div>
                      <EmojiPanel code={generateCode(CONNECTION_REAL_ADDRESS)} />
                      <hr />
                      <EmojiForm
                        notifications={[]}
                        onDenyClick={() => {}}
                        setPublicKey={() => {}}
                      />
                    </div>
                  ) : <Spinner />;
                }}
              />
              <Route
                exact
                path="/topUp"
                render={() =>
                  <div>
                    <Link to="/topUpRegular">Regular</Link><br />
                    <Link to="/topUpDeployment">Deployment</Link>
                  </div>}
              />
              <Route
                exact
                path="/topUpRegular"
                render={() => {
                  const topUpWalletService = new WalletService(sdk);
                  const topUpDeployedWallet = new DeployedWallet(TEST_CONTRACT_ADDRESS, 'bob.mylogin.eth', TEST_PRIVATE_KEY, sdk);
                  topUpWalletService.setWallet(topUpDeployedWallet.asApplicationWallet);
                  if (!relayerConfig) {
                    return <Spinner />;
                  }
                  return <TopUp
                    walletService={topUpWalletService}
                    hideModal={() => history.back()}
                    isModal
                  />;
                }}
              />
              <Route
                exact
                path="/topUpDeployment"
                render={() => {
                  const topUpWalletService = new WalletService(sdk);
                  topUpWalletService.setFutureWallet(futureWallet, name);
                  if (!relayerConfig) {
                    return <Spinner />;
                  }
                  return <TopUp
                    walletService={topUpWalletService}
                    hideModal={() => history.back()}
                    isModal
                  />;
                }}
              />
              <Route exact path="/settings" render={() => <Settings deployedWallet={new DeployedWallet(TEST_CONTRACT_ADDRESS, 'bob.mylogin.eth', TEST_PRIVATE_KEY, sdk)} />} />
              <Route exact path="/recover" render={() => (<div><p>Recover</p></div>)} />
              <Route exact path="/waiting">
                <ModalWrapper>
                  <WaitingForOnRampProvider onRampProviderName={'ramp'} />
                </ModalWrapper>
              </Route>
              <Route exact path="/waitForTransaction">
                <div>
                  <Link to="/waitForTransaction/withHash">With hash</Link><br />
                  <Link to="/waitForTransaction/withoutHash">Without hash</Link>
                </div>
              </Route>
              <Route
                path="/waitForTransaction/"
                render={({location}) => {
                  if (!relayerConfig) {
                    return <Spinner />;
                  } else {
                    return (
                      <ModalWrapper>
                        <WaitingForTransaction
                          action="Waiting for transaction"
                          relayerConfig={relayerConfig}
                          transactionHash={location.pathname === '/waitForTransaction/withHash' ? TEST_TRANSACTION_HASH : undefined}
                        />
                      </ModalWrapper>
                    );
                  }
                }}>
              </Route>
              <Route component={() => (<p>not found</p>)} />
            </Switch>
          </div>
        </div>
      </ThemeProvider>
    </BrowserRouter >
  );
};

export default App;
