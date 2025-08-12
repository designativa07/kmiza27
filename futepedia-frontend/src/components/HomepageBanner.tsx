'use client';

import { useEffect, useState } from 'react';
import { getApiUrl } from '@/lib/config';
import Link from 'next/link';

interface BannerSettings {
  desktopUrl: string | null;
  mobileUrl: string | null;
  linkUrl: string | null;
}

export default function HomepageBanner() {
  const [settings, setSettings] = useState<BannerSettings>({
    desktopUrl: null,
    mobileUrl: null,
    linkUrl: null,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const normalize = (data: any): string | null => {
      if (!data) return null;
      if (typeof data === 'string') return data || null;
      if (typeof data === 'object' && 'value' in data) return data.value || null;
      return null;
    };

    const fetchSettings = async () => {
      try {
        const API_URL = getApiUrl();
        const [desktopRes, mobileRes, linkRes] = await Promise.all([
          fetch(`${API_URL}/system-settings/homepage_banner_desktop_url`),
          fetch(`${API_URL}/system-settings/homepage_banner_mobile_url`),
          fetch(`${API_URL}/system-settings/homepage_banner_link_url`),
        ]);

        const [desktopRaw, mobileRaw, linkRaw] = await Promise.all([
          desktopRes.ok ? desktopRes.json() : null,
          mobileRes.ok ? mobileRes.json() : null,
          linkRes.ok ? linkRes.json() : null,
        ]);

        setSettings({
          desktopUrl: normalize(desktopRaw),
          mobileUrl: normalize(mobileRaw),
          linkUrl: normalize(linkRaw),
        });
      } catch (err) {
        // Silenciar erros e simplesmente não renderizar o banner
        setSettings({ desktopUrl: null, mobileUrl: null, linkUrl: null });
      } finally {
        setLoaded(true);
      }
    };

    fetchSettings();
  }, []);

  if (!loaded) return null;

  const isValidUrl = (u: string | null): boolean => {
    if (!u) return false;
    const s = String(u).trim();
    if (!s) return false;
    return s.startsWith('http://') || s.startsWith('https://');
  };

  const desktopUrl = isValidUrl(settings.desktopUrl) ? settings.desktopUrl!.trim() : null;
  const mobileUrl = isValidUrl(settings.mobileUrl) ? settings.mobileUrl!.trim() : null;
  const linkUrl = isValidUrl(settings.linkUrl) ? settings.linkUrl!.trim() : null;
  const hasAnyImage = Boolean(desktopUrl || mobileUrl);
  if (!hasAnyImage) return null;

  const BannerImage = () => (
    <>
      {desktopUrl && (
        <img
          src={desktopUrl}
          alt="Banner"
          className="hidden lg:block w-full rounded-lg shadow-sm"
        />
      )}
      {mobileUrl && (
        <img
          src={mobileUrl}
          alt="Banner"
          className="block lg:hidden w-full rounded-lg shadow-sm"
        />
      )}
      {!desktopUrl && mobileUrl && (
        <img
          src={mobileUrl}
          alt="Banner"
          className="hidden lg:block w-full rounded-lg shadow-sm"
        />
      )}
      {!mobileUrl && desktopUrl && (
        <img
          src={desktopUrl}
          alt="Banner"
          className="block lg:hidden w-full rounded-lg shadow-sm"
        />
      )}
    </>
  );

  return (
    <div className="mb-6">
      {linkUrl ? (
        <Link href={linkUrl} target="_blank" rel="noopener noreferrer">
          <BannerImage />
        </Link>
      ) : (
        <BannerImage />
      )}
    </div>
  );
}


