// Presentation metadata only. Route definitions and permission gates stay in utils/constants.js.
import { Activity, Ban, Beaker, Bell, CreditCard, FileText, Flag, Gift, Heart,
  Headset, LayoutDashboard, LineChart, MessageSquare, Monitor, Phone, ScrollText,
  Settings, Shield, ShieldAlert, ShieldCheck, Sparkles, Ticket, Users, Wallet } from 'lucide-react';
import { NAV_GROUPS } from '../utils/constants.js';

export const NAV_ICONS = {
  '/dashboard': LayoutDashboard, '/users': Users, '/staff': Shield,
  '/verifications': ShieldCheck, '/matches': Heart, '/swipes': Sparkles,
  '/messaging': MessageSquare, '/blocks': Ban, '/calls': Phone, '/reports': Flag,
  '/fraud': ShieldAlert, '/subscriptions': CreditCard, '/payments': Wallet,
  '/coupons': Ticket, '/referrals': Gift, '/notifications': Bell, '/cms': FileText,
  '/experiments': Beaker, '/support': Headset, '/analytics': LineChart,
  '/monitoring': Monitor, '/audit-logs': ScrollText,
  '/security/login-activity': ShieldCheck, '/settings': Settings,
};

export function getPagePresentation(pathname) {
  for (const group of NAV_GROUPS) {
    const item = group.items.find(({ to }) => pathname === to || pathname.startsWith(`${to}/`));
    if (item) return { ...item, group: group.label, Icon: NAV_ICONS[item.to] ?? Activity };
  }
  return { label: 'Workspace', group: 'Administration', Icon: LayoutDashboard };
}
