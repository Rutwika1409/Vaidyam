import React from 'react';

export default function SkeletonCard({ type = 'card' }) {
  if (type === 'list') {
    return (
      <div className="premium-card p-4 space-y-3">
        <div className="h-4 w-1/3 rounded skeleton-shimmer"></div>
        <div className="h-3 w-3/4 rounded skeleton-shimmer"></div>
        <div className="h-3 w-1/2 rounded skeleton-shimmer"></div>
      </div>
    );
  }

  if (type === 'stat') {
    return (
      <div className="premium-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-8 rounded-full skeleton-shimmer"></div>
          <div className="h-4 w-24 rounded skeleton-shimmer"></div>
        </div>
        <div className="h-8 w-16 rounded skeleton-shimmer"></div>
      </div>
    );
  }

  return (
    <div className="premium-card p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 rounded-full skeleton-shimmer"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 rounded skeleton-shimmer"></div>
          <div className="h-3 w-1/3 rounded skeleton-shimmer"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded skeleton-shimmer"></div>
        <div className="h-3 w-5/6 rounded skeleton-shimmer"></div>
      </div>
      <div className="flex space-x-2 pt-2">
        <div className="h-8 w-20 rounded skeleton-shimmer"></div>
        <div className="h-8 w-24 rounded skeleton-shimmer"></div>
      </div>
    </div>
  );
}
