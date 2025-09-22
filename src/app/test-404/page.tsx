"use client";

import { notFound } from 'next/navigation';

export default function Test404() {
  // Force trigger 404
  notFound();
  
  return <div>This should not render</div>;
}
