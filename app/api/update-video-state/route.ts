import { NextRequest, NextResponse } from "next/server";

const SPYNE_ENDPOINT =
  "https://api.spyne.ai/video-service/v1/studio/qc/update-video-states";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const {
      videoId,
      toUnHide,
      crmStatus,
      toReject,
      authToken,
      sessionCookie,
      extraHeaders,
    } = payload ?? {};

    if (!videoId || typeof videoId !== "string") {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      );
    }
    if (!authToken || typeof authToken !== "string") {
      return NextResponse.json(
        { error: "Auth token is required" },
        { status: 400 }
      );
    }

    // The session cookie is a shared service credential, so it's baked
    // into the deployment as an env var. A per-request value in the
    // body (if ever sent) overrides it, useful for local testing.
    const resolvedCookie = sessionCookie?.trim() || process.env.SPYNE_SESSION_COOKIE;
    if (!resolvedCookie) {
      return NextResponse.json(
        {
          error:
            "No session cookie configured. Set SPYNE_SESSION_COOKIE in the Vercel project's environment variables.",
        },
        { status: 500 }
      );
    }

    // Build headers. authToken is passed through as-is under Authorization
    // by default. If the token already looks like a full header value
    // (e.g. starts with "Bearer "), we don't double-prefix it.
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: authToken.trim().toLowerCase().startsWith("bearer")
        ? authToken.trim()
        : `Bearer ${authToken.trim()}`,
      // sails.sid=... — required by this endpoint in addition to the bearer token.
      Cookie: resolvedCookie,
    };

    // Allow pasting any additional headers (e.g. cookies, x-tenant-id, etc.)
    // captured from Postman, as a raw JSON object.
    if (extraHeaders && typeof extraHeaders === "string" && extraHeaders.trim()) {
      try {
        const parsed = JSON.parse(extraHeaders);
        Object.assign(headers, parsed);
      } catch {
        return NextResponse.json(
          { error: "Additional headers must be valid JSON" },
          { status: 400 }
        );
      }
    }

    const upstreamRes = await fetch(SPYNE_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        videoId,
        toUnHide: !!toUnHide,
        crmStatus,
        toReject: !!toReject,
      }),
    });

    const text = await upstreamRes.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }

    return NextResponse.json(
      { status: upstreamRes.status, ok: upstreamRes.ok, body },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error calling upstream API" },
      { status: 500 }
    );
  }
}
