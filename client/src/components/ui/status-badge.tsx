import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Status Badge Component
 * 
 * A reusable badge component that displays a status with appropriate colors
 * and optional icon based on the status value.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status,
  showIcon = true,
  className = '',
  size = 'md'
}) => {
  // Default to empty string if status is undefined
  const statusText = status || '';
  
  // Get appropriate colors based on status
  const getStatusStyles = () => {
    switch (statusText.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress':
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'on-hold':
      case 'on hold':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Get appropriate icon based on status
  const getStatusIcon = () => {
    switch (statusText.toLowerCase()) {
      case 'pending':
        return 'pending';
      case 'in-progress':
      case 'in progress':
        return 'hourglass_top';
      case 'completed':
        return 'check_circle';
      case 'rejected':
        return 'cancel';
      case 'approved':
        return 'verified';
      case 'on-hold':
      case 'on hold':
        return 'pause_circle';
      default:
        return 'help';
    }
  };
  
  // Size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-1.5 py-0.5';
      case 'lg':
        return 'text-sm px-3 py-1.5';
      case 'md':
      default:
        return 'text-xs px-2 py-1';
    }
  };
  
  return (
    <span 
      className={cn(
        'inline-flex items-center font-medium rounded border',
        getStatusStyles(),
        getSizeClasses(),
        className
      )}
    >
      {showIcon && (
        <span className="material-icons text-[0.9em] mr-1" style={{ fontSize: '1em' }}>
          {getStatusIcon()}
        </span>
      )}
      <span className="capitalize">
        {statusText.replace(/-/g, ' ')}
      </span>
    </span>
  );
};