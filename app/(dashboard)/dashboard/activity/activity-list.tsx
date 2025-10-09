'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  UserMinus,
  Mail,
  CheckCircle,
  type LucideIcon
} from 'lucide-react';
import { activity, ActivityType } from '@/lib/db/schema';

type Log = typeof activity.$inferSelect;

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle
};

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function formatAction(action: ActivityType): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return 'You signed up';
    case ActivityType.SIGN_IN:
      return 'You signed in';
    case ActivityType.SIGN_OUT:
      return 'You signed out';
    case ActivityType.UPDATE_PASSWORD:
      return 'You changed your password';
    case ActivityType.DELETE_ACCOUNT:
      return 'You deleted your account';
    case ActivityType.UPDATE_ACCOUNT:
      return 'You updated your account';
    case ActivityType.CREATE_TEAM:
      return 'You created a new team';
    case ActivityType.REMOVE_TEAM_MEMBER:
      return 'You removed a team member';
    case ActivityType.INVITE_TEAM_MEMBER:
      return 'You invited a team member';
    case ActivityType.ACCEPT_INVITATION:
      return 'You accepted an invitation';
    default:
      return 'Unknown action occurred';
  }
}

export function ActivityList({ logs }: { logs: Log[] }) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <ul className="space-y-4">
      {logs.map((log) => {
        const Icon = iconMap[log.action as ActivityType] || Settings;
        const formattedAction = formatAction(log.action as ActivityType);
        const date = new Date(log.timestamp);

        return (
          <li key={log.id} className="flex items-center space-x-4">
            <div className="bg-primary/10 text-primary rounded-full p-2">
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {formattedAction}
                {log.ipAddress && ` from IP ${log.ipAddress}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {isClient ? getRelativeTime(date) : date.toLocaleDateString()}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
