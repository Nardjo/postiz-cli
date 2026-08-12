import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { CliError, handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  fields?: string;
  group?: string;
  refresh?: string;
  data?: string;
  param?: string[];
}

function collectParam(val: string, prev: string[]): string[] {
  prev.push(val);
  return prev;
}

function parseParams(pairs?: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of pairs ?? []) {
    const idx = p.indexOf("=");
    if (idx <= 0) {
      throw new CliError(2, `Invalid --param '${p}'. Expected key=value.`);
    }
    out[p.slice(0, idx)] = p.slice(idx + 1);
  }
  return out;
}

export const integrationsResource = new Command("integrations").description(
  "Manage connected social media channels",
);

// ── LIST ──────────────────────────────────────────────
integrationsResource
  .command("list")
  .description("List all connected integrations (channels)")
  .option("--group <id>", "Filter by customer/group ID")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  postiz-cli integrations list --json\n  postiz-cli integrations list --group cust_123",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const data = await client.get("/integrations", {
        ...(opts.group && { group: opts.group }),
      });
      output(data, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── CONNECTED ─────────────────────────────────────────
integrationsResource
  .command("connected")
  .description("Check if the API key is valid and connected")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  postiz-cli integrations connected --json")
  .action(async (opts: ActionOpts) => {
    try {
      const data = await client.get("/is-connected");
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── CONNECT ───────────────────────────────────────────
integrationsResource
  .command("connect")
  .description("Get an OAuth URL to connect (or refresh) a channel")
  .argument("<provider>", "Provider id (e.g. x, linkedin, facebook, instagram)")
  .option("--refresh <id>", "Existing integration ID to refresh instead of creating new")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  postiz-cli integrations connect x\n  postiz-cli integrations connect linkedin --refresh integ_123",
  )
  .action(async (provider: string, opts: ActionOpts) => {
    try {
      const data = await client.get(`/social/${encodeURIComponent(provider)}`, {
        ...(opts.refresh && { refresh: opts.refresh }),
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── SETTINGS ──────────────────────────────────────────
integrationsResource
  .command("settings")
  .description("Get posting rules, settings schema, and tools for a channel")
  .argument("<id>", "Integration ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  postiz-cli integrations settings integ_123 --json")
  .action(async (id: string, opts: ActionOpts) => {
    try {
      const data = await client.get(`/integration-settings/${encodeURIComponent(id)}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── TRIGGER ───────────────────────────────────────────
integrationsResource
  .command("trigger")
  .description("Execute a provider-specific tool on a connected channel")
  .argument("<id>", "Integration ID")
  .argument("<method>", "Tool method name from settings")
  .option("--data <json>", "Tool parameters as a JSON object")
  .option("--param <key=value>", "Tool parameter (repeatable)", collectParam, [] as string[])
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  postiz-cli integrations trigger integ_123 listChannels --json\n  postiz-cli integrations trigger integ_123 search --param q=music --json",
  )
  .action(async (id: string, method: string, opts: ActionOpts) => {
    try {
      let dataObj: Record<string, string> = {};
      if (opts.data) {
        const parsed = JSON.parse(opts.data) as Record<string, unknown>;
        for (const [k, v] of Object.entries(parsed)) {
          dataObj[k] = typeof v === "string" ? v : JSON.stringify(v);
        }
      }
      dataObj = { ...dataObj, ...parseParams(opts.param) };
      const body: Record<string, unknown> = { methodName: method };
      if (Object.keys(dataObj).length > 0) body.data = dataObj;
      const data = await client.post(`/integration-trigger/${encodeURIComponent(id)}`, body);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── SLOT ──────────────────────────────────────────────
integrationsResource
  .command("slot")
  .description("Find the next available posting slot for a channel")
  .argument("<id>", "Integration ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  postiz-cli integrations slot integ_123 --json")
  .action(async (id: string, opts: ActionOpts) => {
    try {
      const data = await client.get(`/find-slot/${encodeURIComponent(id)}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DELETE ────────────────────────────────────────────
integrationsResource
  .command("delete")
  .description("Delete a connected channel (and its scheduled posts)")
  .argument("<id>", "Integration ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  postiz-cli integrations delete integ_123")
  .action(async (id: string, opts: ActionOpts) => {
    try {
      await client.delete(`/integrations/${encodeURIComponent(id)}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
