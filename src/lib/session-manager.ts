import type { Session, SessionStatus } from "@/types/session";

const sessions = new Map<string, Session>();

export function upsertSession(session: Session) {
  sessions.set(session.sessionId, session);
  return session;
}

export function getSession(sessionId: string) {
  return sessions.get(sessionId);
}

export function getSessions() {
  return Array.from(sessions.values());
}

export function updateSessionStatus(
  sessionId: string,
  status: SessionStatus,
  errorMessage?: string,
) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const updated: Session = {
    ...session,
    status,
    lastActivity: new Date().toISOString(),
    ...(errorMessage ? { errorMessage } : { errorMessage: undefined }),
  };

  sessions.set(sessionId, updated);
  return updated;
}

export function removeSession(sessionId: string) {
  const session = sessions.get(sessionId);
  sessions.delete(sessionId);
  return session;
}

export function touchSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  const updated = { ...session, lastActivity: new Date().toISOString() };
  sessions.set(sessionId, updated);
  return updated;
}
