import { describe, it, expect } from "bun:test";
import { parseZealUa, buildEvent } from "./track";

describe("parseZealUa", () => {
    it("returns empty object for null/missing header", () => {
        expect(parseZealUa(null)).toEqual({});
    });

    it("returns empty object for invalid JSON", () => {
        expect(parseZealUa("not json")).toEqual({});
    });

    it("returns empty object for non-object payload", () => {
        expect(parseZealUa("[]")).toEqual({});
        expect(parseZealUa('"string"')).toEqual({});
        expect(parseZealUa("42")).toEqual({});
    });

    it("parses valid Zeal UA payload", () => {
        const json = JSON.stringify({
            app: { version: "0.7.2", qt_version: "6.6.1", install_id: "abc-123" },
            os: { name: "Ubuntu 24.04", arch: "x86_64", locale: "en_US" },
        });
        const out = parseZealUa(json);
        expect(out.app?.version).toBe("0.7.2");
        expect(out.os?.locale).toBe("en_US");
    });
});

describe("buildEvent", () => {
    it("populates fields from X-Zeal-User-Agent and User-Agent headers", () => {
        const req = new Request("http://localhost/d/com.kapeli/Akka/latest", {
            headers: {
                "user-agent": "Zeal/0.7.2",
                "x-zeal-user-agent": JSON.stringify({
                    app: { version: "0.7.2", qt_version: "6.6.1", install_id: "uuid-1" },
                    os: {
                        name: "Ubuntu 24.04",
                        arch: "x86_64",
                        product_type: "ubuntu",
                        product_version: "24.04",
                        kernel_type: "linux",
                        kernel_version: "6.5.0",
                        locale: "en_US",
                    },
                }),
            },
        });
        const ev = buildEvent(req, {
            event: "download",
            source_id: "com.kapeli.dash",
            source_id_raw: "com.kapeli",
            docset_id: "Akka",
            version: "latest",
            mirror: "frankfurt.kapeli.com",
        });
        expect(ev.event).toBe("download");
        expect(ev.source_id).toBe("com.kapeli.dash");
        expect(ev.source_id_raw).toBe("com.kapeli");
        expect(ev.docset_id).toBe("Akka");
        expect(ev.version).toBe("latest");
        expect(ev.mirror).toBe("frankfurt.kapeli.com");
        expect(ev.app_version).toBe("0.7.2");
        expect(ev.qt_version).toBe("6.6.1");
        expect(ev.install_id).toBe("uuid-1");
        expect(ev.os_name).toBe("Ubuntu 24.04");
        expect(ev.os_arch).toBe("x86_64");
        expect(ev.os_product_type).toBe("ubuntu");
        expect(ev.kernel_type).toBe("linux");
        expect(ev.locale).toBe("en_US");
        expect(ev.ua_raw).toBe("Zeal/0.7.2");
        expect(typeof ev.ts).toBe("string");
    });

    it("leaves Zeal-only fields undefined when header missing (e.g. curl)", () => {
        const req = new Request("http://localhost/v1/docsets", {
            headers: { "user-agent": "curl/8.0" },
        });
        const ev = buildEvent(req, { event: "catalog" });
        expect(ev.app_version).toBeUndefined();
        expect(ev.install_id).toBeUndefined();
        expect(ev.ua_raw).toBe("curl/8.0");
    });

    it("ignores non-string values inside the JSON payload", () => {
        const req = new Request("http://localhost/", {
            headers: {
                "x-zeal-user-agent": JSON.stringify({
                    app: { version: 123, install_id: { nested: true } },
                }),
            },
        });
        const ev = buildEvent(req, { event: "catalog" });
        expect(ev.app_version).toBeUndefined();
        expect(ev.install_id).toBeUndefined();
    });
});
