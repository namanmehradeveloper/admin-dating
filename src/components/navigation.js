// Presentation metadata only. Route definitions and permission gates stay in utils/constants.js.
import { Activity, Ban, Beaker, Bell, CreditCard, FileText, Flag, Gift, Heart,
  Headset, LayoutDashboard, LineChart, MessageSquare, Monitor, Phone, ScrollText,
  Settings, Shield, ShieldAlert, ShieldCheck, Sparkles, Ticket, Users, Wallet } from 'lucide-react';
import { NAV_GROUPS } from '../utils/constants.js';

export const NAV_ICONS = {
  '/dashboard': LayoutDashboard, '/users': Users, '/staff': Shield,
  '/verifications': ShieldCheck, '/matches': Heart, '/swipes': Sparkles,
  '/messaging': MessageSquare, '/blocks': Ban, '/calls': Phone, '/reports': Flag,
  '/fraud': ShieldAlert, '/subscriptions': CreditCard, '/subscriptions/plans': CreditCard, '/payments': Wallet,
  '/coupons': Ticket, '/referrals': Gift, '/notifications': Bell, '/cms': FileText,
  '/experiments': Beaker, '/support': Headset, '/analytics': LineChart,
  '/monitoring': Monitor, '/audit-logs': ScrollText,
  '/security/login-activity': ShieldCheck, '/settings': Settings,
};

export function getPagePresentation(pathname) {
  let best = null;
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      const matches = pathname === item.to || pathname.startsWith(`${item.to}/`);
      if (!matches) continue;
      if (!best || item.to.length > best.item.to.length) {
        best = { item, group: group.label };
      }
    }
  }
  if (best) return { ...best.item, group: best.group, Icon: NAV_ICONS[best.item.to] ?? Activity };
  return { label: 'Workspace', group: 'Administration', Icon: LayoutDashboard };
}
