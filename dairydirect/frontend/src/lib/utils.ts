import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ??
    process?.env?.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000';
    
  // Prefer window.location.origin for reliable OAuth redirects on any environment
  if (typeof window !== 'undefined') {
    url = window.location.origin;
  }
  
  // Ensure https when not localhost
  url = url.includes('http') ? url : `https://${url}`;
  
  // Clean trailing slashes
  url = url.replace(/\/+$/, '');
  return url;
};
