import React from 'react';
import {parseDomain} from '@universal-login/commons';

interface EnsNameProps {
  value: string;
}

export const EnsName = ({value}: EnsNameProps) => {
  const [name, domain] = parseDomain(value);
  return <p className="ens-name"><b>{name}</b>.{domain}</p>;
};
