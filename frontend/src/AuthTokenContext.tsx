import { createContext } from 'react';

interface IATC {
  token: string | null;
  setToken: (token: string | null) => void
}

const AuthTokenContext = createContext<IATC>({
  token: localStorage.getItem('authtoken') || null,
  setToken: (_: string | null) => {}
});

export default AuthTokenContext;
