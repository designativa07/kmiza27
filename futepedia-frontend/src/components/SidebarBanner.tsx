'use client';

import { useEffect, useState } from 'react';
import { getApiUrl } from '@/lib/config';
import Link from 'next/link';

interface BannerSettings {
  desktopUrl: string | null;
  mobileUrl: string | null;
  linkUrl: string | null;
}

const isValidUrl = (u: string | null): boolean => {
  if (!u) return false;
  const s = String(u).trim();
  if (!s) return false;
  return s.startsWith('http://') || s.startsWith('https://');
};

export default function SidebarBanner() {
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
          fetch(`${API_URL}/system-settings/homepage_sidebar_banner_desktop_url`),
          fetch(`${API_URL}/system-settings/homepage_sidebar_banner_mobile_url`),
          fetch(`${API_URL}/system-settings/homepage_sidebar_banner_link_url`),
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
      } catch (_) {
        setSettings({ desktopUrl: null, mobileUrl: null, linkUrl: null });
      } finally {
        setLoaded(true);
      }
    };

    fetchSettings();
  }, []);

  if (!loaded) return null;

  const desktopUrl = isValidUrl(settings.desktopUrl) ? settings.desktopUrl!.trim() : null;
  const mobileUrl = isValidUrl(settings.mobileUrl) ? settings.mobileUrl!.trim() : null;
  const linkUrl = isValidUrl(settings.linkUrl) ? settings.linkUrl!.trim() : null;
  const hasAnyImage = Boolean(desktopUrl || mobileUrl);
  if (!hasAnyImage) return null;

  const ImageEl = () => (
    <>
      {/* Desktop (coluna lateral ~2/5 do container) */}
      {desktopUrl && (
        <img src={desktopUrl} alt="Banner lateral" className="hidden lg:block w-full rounded-lg shadow-sm" />
      )}
      {/* Mobile (coluna vira full-width) */}
      {mobileUrl && (
        <img src={mobileUrl} alt="Banner lateral" className="block lg:hidden w-full rounded-lg shadow-sm" />
      )}
      {!desktopUrl && mobileUrl && (
        <img src={mobileUrl} alt="Banner lateral" className="hidden lg:block w-full rounded-lg shadow-sm" />
      )}
      {!mobileUrl && desktopUrl && (
        <img src={desktopUrl} alt="Banner lateral" className="block lg:hidden w-full rounded-lg shadow-sm" />
      )}
    </>
  );

  return (
    <div className="mb-4">
      {linkUrl ? (
        <Link href={linkUrl} target="_blank" rel="noopener noreferrer">
          <ImageEl />
        </Link>
      ) : (
        <ImageEl />
      )}
    </div>
  );
}


