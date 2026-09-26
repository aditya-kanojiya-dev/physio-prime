import { createSign } from 'node:crypto';
import { getConfig } from '../config';

export function jaasConfigured(): boolean {
  const { JAAS_APP_ID, JAAS_API_KEY_ID, JAAS_PRIVATE_KEY } = getConfig();
  return Boolean(JAAS_APP_ID && JAAS_API_KEY_ID && JAAS_PRIVATE_KEY);
}

export interface JaasSession {
  appId: string;
  // JWT room claim — the booking id. JaaS matches it against the room name
  // after the app id in the URL (`8x8.vc/<appId>/<bookingId>`); including the
  // app id in the claim makes JaaS reject the join.
  room: string;
  jwt: string;
  // Ready-to-embed iframe src — what JaaSMeeting builds internally.
  url: string;
}

function base64url(data: string): string {
  return Buffer.from(data, 'utf8').toString('base64url');
}

// Signs a short-lived RS256 JWT permitting the holder to enter the room for
// exactly one booking. The visitor's own name is embedded by the client UI;
// the JWT carries the authoritative identity preview (id + name shown in the
// lobby) plus the moderator flag. `room` is a literal match — a signed token
// for booking A cannot enter booking B's room.
export function signJaasJwt(input: {
  bookingId: string;
  userId: number;
  displayName: string;
  moderator: boolean;
}): JaasSession {
  const { JAAS_APP_ID, JAAS_API_KEY_ID, JAAS_PRIVATE_KEY } = getConfig();
  if (!JAAS_APP_ID || !JAAS_API_KEY_ID || !JAAS_PRIVATE_KEY) {
    throw new Error('JaaS is not configured');
  }
  // Allow newline-escaped values in .env; dotenv also handles real newlines.
  const privateKey = JAAS_PRIVATE_KEY.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const room = input.bookingId;
  const header = { alg: 'RS256' as const, kid: JAAS_API_KEY_ID, typ: 'JWT' as const };
  const payload = {
    aud: 'jitsi',
    iss: 'chat',
    nbf: now - 60,
    exp: now + 2 * 3600,
    room, // ponytail: exact room match; switch to regex:true only if rooms become dynamic
    sub: JAAS_APP_ID,
    context: {
      user: {
        id: String(input.userId),
        name: input.displayName,
        moderator: input.moderator ? 'true' : 'false',
      },
      features: {
        recording: false,
        livestreaming: false,
        transcription: false,
        'outbound-call': false,
      },
      room: { regex: false },
    },
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(privateKey).toString('base64url');
  const jwt = `${signingInput}.${signature}`;

  return {
    appId: JAAS_APP_ID,
    room,
    jwt,
    // Same URL shape the SDK would build: `<appId>/<roomName>?jwt=...`
    url: `https://8x8.vc/${JAAS_APP_ID}/${input.bookingId}?jwt=${jwt}`,
  };
}

// NOTE: there is deliberately no room-URL helper here. Both the patient and the
// doctor join through the *-token endpoints, which return a signed JaaS session.
// A bare https://8x8.vc/<appId>/<room> URL carries no JWT and cannot join a JaaS
// room, so the old videoCallLink field was never a working link. If a shareable
// link is ever wanted, mint a token endpoint variant, not a stored string.