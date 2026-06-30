import type { SelectorStrategy } from '../services/recording.service';

/**
 * A live, in-progress recording session, persisted so it can survive a
 * micro-frontend crossing (single-spa app swap) or an accidental same-origin
 * reload. Only an actively-recording session is ever stored/resumed.
 *
 * The full payload lives in IndexedDB; a lightweight breadcrumb (sessionId +
 * isRecording + updatedAt) is mirrored to localStorage for synchronous detection.
 *
 * See docs/specs/006-cross-app-recording-continuity.md.
 */
export interface ActiveSessionState {
  /** Stable id for the session, generated when recording starts. */
  sessionId: string;
  isRecording: boolean;
  isPaused: boolean;
  commands: string[];
  interceptors: string[];
  selectorStrategy: SelectorStrategy;
  /** Epoch ms when the session started recording. */
  startedAt: number;
  /** Epoch ms of the last mutation — acts as the recency heartbeat. */
  updatedAt: number;
}

/** localStorage key for the synchronous "is a session active?" breadcrumb. */
export const ACTIVE_SESSION_BREADCRUMB_KEY = 'e2e-active-session';

/** Configuration key (in the `configuration` store) for the resume recency TTL. */
export const RESUME_TTL_CONFIG_KEY = 'resumeRecencyTtlMinutes';

/** Default minutes within which an active session resumes silently. */
export const DEFAULT_RESUME_TTL_MINUTES = 30;
