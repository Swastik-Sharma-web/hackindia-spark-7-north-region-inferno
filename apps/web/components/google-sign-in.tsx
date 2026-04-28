'use client';

import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useState, useEffect } from 'react';
import { getGoogleUser, setGoogleUser, clearGoogleUser, GoogleUser } from '@/lib/google-auth';

interface GoogleJwtPayload {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

export function GoogleSignInButton() {
  const [user, setUser] = useState<GoogleUser | null>(null);

  useEffect(() => {
    setUser(getGoogleUser());
  }, []);

  const handleSuccess = (response: CredentialResponse) => {
    if (response.credential) {
      const decoded = jwtDecode<GoogleJwtPayload>(response.credential);
      const userData: GoogleUser = {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        sub: decoded.sub
      };
      setGoogleUser(userData);
      setUser(userData);
    }
  };

  const handleSignOut = () => {
    clearGoogleUser();
    setUser(null);
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <img
          src={user.picture}
          alt={user.name}
          className="h-8 w-8 rounded-full border border-cyan-400/30"
          referrerPolicy="no-referrer"
        />
        <div className="hidden md:block">
          <p className="text-xs text-slate-400">Client</p>
          <p className="text-sm font-medium text-slate-200">{user.name}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="ml-1 rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-red-400/30 hover:text-red-300"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => console.error('Google Sign-In failed')}
        size="medium"
        theme="filled_black"
        shape="pill"
        text="signin_with"
      />
    </div>
  );
}
