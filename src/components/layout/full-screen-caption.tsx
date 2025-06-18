
"use client";

import React from 'react';

interface FullScreenCaptionProps {
  text: string;
}

export function FullScreenCaption({ text }: FullScreenCaptionProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background dark p-4">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline text-primary animate-pulse text-center">
        {text}
      </h1>
    </div>
  );
}
