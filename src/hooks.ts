import { useLayoutEffect, useState, useEffect } from 'react';
import { dashboard as defaultDashboard, DashboardState } from '@lark-base-open/js-sdk';
import { useWorkspace } from './workspace';

function updateTheme(theme: string) {
  document.body.setAttribute('theme-mode', theme);
}

export function useTheme() {
  const { dashboard: wsDashboard } = useWorkspace();
  const dashboard = wsDashboard || defaultDashboard;
  const [bgColor, setBgColor] = useState('#ffffff');

  useLayoutEffect(() => {
    if (!dashboard || typeof dashboard.getTheme !== 'function') return;

    dashboard.getTheme().then((res: any) => {
      setBgColor(res.chartBgColor);
      updateTheme(res.theme.toLocaleLowerCase());
    }).catch(() => {});

    dashboard.onThemeChange((res: any) => {
      setBgColor(res.data.chartBgColor);
      updateTheme(res.data.theme.toLocaleLowerCase());
    });
  }, [dashboard]);

  return { bgColor };
}

export function useConfig(updateConfig: (data: any) => void) {
  const isCreate = defaultDashboard?.state === DashboardState.Create;

  useEffect(() => {
    if (isCreate || !defaultDashboard?.getConfig) return;
    defaultDashboard.getConfig().then(updateConfig).catch(() => {});
  }, []);

  useEffect(() => {
    if (!defaultDashboard?.onConfigChange) return;
    const off = defaultDashboard.onConfigChange((r: any) => updateConfig(r.data));
    return () => off();
  }, []);

  return { isCreate };
}

export { DashboardState };
