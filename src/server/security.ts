/**
 * Lightweight security helpers for CogniVault.
 * Addresses CodeQL alerts: rate limiting, ReDoS, and incomplete sanitization.
 */

import type { Request, Response, NextFunction } from 'express';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const buckets = new Map<string, { count: number; reset: number }>();

/** Simple in-memory rate limiter (per IP). */
export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let bucket = buckets.get(ip);

  if (!bucket || now > bucket.reset) {
    bucket = { count: 1, reset: now + WINDOW_MS };
    buckets.set(ip, bucket);
    next();
    return;
  }

  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many requests. Try again later.' });
    return;
  }
  next();
}

/** Safe DOI extraction with length bound to avoid ReDoS. */
export function extractDOISafe(input: string): string | null {
  if (!input || input.length > 500) return null;
  const match = input.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]{1,200}/i);
  if (!match) return null;
  return match[0].replace(/[.,;)]+$/, '');
}

/** Strip HTML tags more thoroughly than a single regex pass. */
export function stripHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/&/g, '&')
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .slice(0, 300);
}
