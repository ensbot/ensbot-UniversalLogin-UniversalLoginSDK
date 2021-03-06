import React, {useEffect, useState, useRef} from 'react';
import {
  DebouncedSuggestionsService,
  Suggestions,
  SuggestionsService,
  WalletSuggestionAction,
  WALLET_SUGGESTION_ALL_ACTIONS,
} from '@universal-login/commons';
import {SuggestionComponent} from './Suggestions';
import {Input} from '../commons/Input';
import Logo from './../assets/logo.svg';
import {Spinner} from '../..';
import {getSuggestion} from '../../core/utils/getSuggestion';
import UniversalLoginSDK from '@universal-login/sdk';
import {useOutsideClick} from '../hooks/useClickOutside';

export interface EnsNamePicker {
  onCreateClick?(ensName: string): Promise<void> | void;
  onConnectClick?(ensName: string): Promise<void> | void;
  sdk: UniversalLoginSDK;
  domains: string[];
  actions?: WalletSuggestionAction[];
  placeholder?: string;
}

export const EnsNamePicker = ({
  onCreateClick,
  onConnectClick,
  sdk,
  domains,
  actions = WALLET_SUGGESTION_ALL_ACTIONS,
  placeholder = 'type a name',
}: EnsNamePicker) => {
  const [debouncedSuggestionsService] = useState(() =>
    new DebouncedSuggestionsService(
      new SuggestionsService(sdk, domains, actions),
    ),
  );

  const [ensName, setEnsName] = useState('');

  const [suggestions, setSuggestions] = useState<Suggestions | undefined>({connections: [], creations: []});
  useEffect(() => {
    setSuggestions(undefined);
    debouncedSuggestionsService.getSuggestions(ensName, setSuggestions);
  }, [ensName]);

  const [suggestionVisible, setSuggestionVisible] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, () => setSuggestionVisible(false));

  return (
    <div ref={ref}>
      <div className="selector-input-wrapper">
        <img
          src={Logo}
          alt="Universal login logo"
          className="selector-input-img"
        />
        <Input
          className="wallet-selector"
          id="loginInput"
          onChange={(event) => setEnsName(event.target.value.toLowerCase())}
          placeholder={placeholder}
          autoFocus
          checkSpelling={false}
          onFocus={() => setSuggestionVisible(true)}
        />
        {suggestions === undefined && <Spinner className="spinner-busy-indicator" />}
      </div>
      {
        suggestionVisible && suggestions !== undefined &&
        <SuggestionComponent
          suggestion={getSuggestion(suggestions, actions, ensName)}
          onCreateClick={onCreateClick}
          onConnectClick={onConnectClick}
          actions={actions}
        />
      }
    </div>
  );
};
