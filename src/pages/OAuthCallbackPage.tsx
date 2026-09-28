import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { tokenStorage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { homeFor, returnTo } from '../lib/routes';

// Target of GET /api/v1/auth/google/callback's redirect (see
// googleAuth.controller.ts): `${CORS_ORIGIN}/oauth-callback?accessToken=&refreshToken=`.
export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const { refreshUser } = useAuth();
  const [ready, setReady] = useState(false);
  const [target, setTarget] = useState('/login');

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (!accessToken || !refreshToken) {
      setTarget('/login');
      setReady(true);
      return;
    }
    tokenStorage.setTokens(accessToken, refreshToken);
    refreshUser().then((me) => {
      setTarget(me ? returnTo.take() ?? homeFor(me) : '/login');
      setReady(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return null;
  return <Navigate to={target} replace />;
}
