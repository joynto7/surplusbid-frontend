import type { Me } from './api';

const RETURN_TO_KEY = 'surplusbid.returnTo';

/** Where a signed-in user lands by default. */
export function homeFor(me: Pick<Me, 'role' | 'verificationStatus'>) {
  if (me.role === 'ADMIN') return '/admin';
  if (me.verificationStatus === 'UNVERIFIED') return '/verify-business';
  if (me.verificationStatus === 'VERIFIED') {
    if (me.role === 'BUYER') return '/buyer';
    if (me.role === 'SELLER') return '/seller';
  }
  return '/verification-status';
}

/** Remember a page to come back to across a sign-in (incl. the Google redirect). */
export const returnTo = {
  set: (path: string) => sessionStorage.setItem(RETURN_TO_KEY, path),
  /** Reads and clears the saved path. */
  take: () => {
    const path = sessionStorage.getItem(RETURN_TO_KEY);
    sessionStorage.removeItem(RETURN_TO_KEY);
    // Only same-app paths; never an absolute URL.
    return path && path.startsWith('/') && !path.startsWith('//') ? path : null;
  },
};
