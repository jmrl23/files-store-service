import { createContext, useContext } from 'react';

export interface ApiContextValue {
  key: string;
  setKey(key: string): void;
}

export const ApiContext = createContext<ApiContextValue | undefined>(undefined);

export const useApiContext = () => {
  const apiContext = useContext(ApiContext);
  if (!apiContext)
    throw new Error("Cannot use API context outside it's provider's scope");
  return apiContext;
};
