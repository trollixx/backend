import { geolocation, waitUntil } from "@vercel/functions";

const TINYBIRD_URL = process.env.TINYBIRD_URL ?? "https://api.us-east.aws.tinybird.co/v0/events";
const TINYBIRD_TOKEN = process.env.TINYBIRD_TOKEN;
const TINYBIRD_DATASOURCE = process.env.TINYBIRD_DATASOURCE ?? "events";
const TINYBIRD_TIMEOUT_MS = 1000;

export type EventName = "download" | "catalog" | "releases" | "link";

export type EventBase = {
    event: EventName;
    source_id?: string;
    source_id_raw?: string;
    docset_id?: string;
    version?: string;
    link_id?: string;
    mirror?: string;
};

type ZealUaApp = { version?: unknown; qt_version?: unknown; install_id?: unknown };
type ZealUaOs = {
    arch?: unknown;
    name?: unknown;
    product_type?: unknown;
    product_version?: unknown;
    kernel_type?: unknown;
    kernel_version?: unknown;
    locale?: unknown;
};
type ZealUa = { app?: ZealUaApp; os?: ZealUaOs };

const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

export function parseZealUa(header: string | null): ZealUa {
    if (!header) return {};
    try {
        const v = JSON.parse(header);
        return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as ZealUa) : {};
    } catch {
        return {};
    }
}

export function buildEvent(request: Request, base: EventBase): Record<string, unknown> {
    const zua = parseZealUa(request.headers.get("x-zeal-user-agent"));
    let country: string | undefined;
    let region: string | undefined;
    try {
        const geo = geolocation(request);
        country = geo.country;
        region = geo.countryRegion;
    } catch {
        // Not on Vercel — geolocation unavailable.
    }
    return {
        ts: new Date().toISOString(),
        event: base.event,
        source_id: base.source_id,
        source_id_raw: base.source_id_raw,
        docset_id: base.docset_id,
        version: base.version,
        link_id: base.link_id,
        mirror: base.mirror,
        country,
        region,
        app_version: str(zua.app?.version),
        qt_version: str(zua.app?.qt_version),
        install_id: str(zua.app?.install_id),
        os_name: str(zua.os?.name),
        os_arch: str(zua.os?.arch),
        os_product_type: str(zua.os?.product_type),
        os_product_version: str(zua.os?.product_version),
        kernel_type: str(zua.os?.kernel_type),
        kernel_version: str(zua.os?.kernel_version),
        locale: str(zua.os?.locale),
        ua_raw: request.headers.get("user-agent") ?? undefined,
    };
}

async function postEvent(event: Record<string, unknown>): Promise<void> {
    try {
        const res = await fetch(`${TINYBIRD_URL}?name=${encodeURIComponent(TINYBIRD_DATASOURCE)}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-ndjson",
                Authorization: `Bearer ${TINYBIRD_TOKEN}`,
            },
            body: `${JSON.stringify(event)}\n`,
            signal: AbortSignal.timeout(TINYBIRD_TIMEOUT_MS),
        });
        if (!res.ok) {
            console.warn(`[track] tinybird responded ${res.status}`);
        }
    } catch (err) {
        console.warn("[track] failed:", (err as Error).message);
    }
}

export function track(request: Request, base: EventBase): void {
    if (!TINYBIRD_TOKEN) return;
    waitUntil(postEvent(buildEvent(request, base)));
}
