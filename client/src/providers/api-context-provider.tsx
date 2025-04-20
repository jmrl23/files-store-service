import { ApiContext } from '@/contexts/api-context';
import { PropsWithChildren, useState } from 'react';

export type ApiContextProviderProps = PropsWithChildren & {};

export function ApiContextProvider(props: ApiContextProviderProps) {
  const [key, setKey] = useState<string>('jomariel.authenticate');

  return (
    <ApiContext.Provider value={{ key, setKey }}>
      {props.children}
    </ApiContext.Provider>
  );
}
