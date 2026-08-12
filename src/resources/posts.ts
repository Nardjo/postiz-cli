import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { CliError, handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  fields?: string;
  startDate?: string;
  endDate?: string;
  customer?: string;
  body?: string;
  file?: string;
  type?: string;
  date?: string;
  integration?: string;
  content?: string;
  settingsType?: string;
  shortLink?: boolean;
  releaseId?: string;
  status?: string;
  settings?: string;
}

async function loadJsonBody(opts: ActionOpts): Promise<Record<string, unknown> | null> {
  if (opts.body && opts.file) {
    throw new CliError(2, "Use either --body or --file, not both.");
  }
  if (opts.body) {
    try {
      return JSON.parse(opts.body) as Record<string, unknown>;
    } catch {
      throw new CliError(2, "--body must be valid JSON.");
    }
  }
  if (opts.file) {
    try {
      const text = await Bun.file(opts.file).text();
      return JSON.parse(text) as Record<string, unknown>;
    } catch (err) {
      throw new CliError(2, `Failed to read/parse --file: ${String(err)}`);
    }
  }
  return null;
}

function buildConvenienceBody(opts: ActionOpts): Record<string, unknown> {
  if (!opts.type || !opts.date || !opts.integration || !opts.content || !opts.settingsType) {
    throw new CliError(
      2,
      "Provide --body/--file, or all of: --type --date --integration --content --settings-type",
    );
  }
  return {
    type: opts.type,
    date: opts.date,
    shortLink: Boolean(opts.shortLink),
    tags: [],
    posts: [
      {
        integration: { id: opts.integration },
        value: [{ content: opts.content, image: [] }],
        settings: { __type: opts.settingsType },
      },
    ],
  };
}

export const postsResource = new Command("posts").description(
  "Create, list, and manage social media posts",
);

// ── LIST ──────────────────────────────────────────────
postsResource
  .command("list")
  .description("List posts within a date range")
  .requiredOption("--start-date <iso>", "Start date (UTC ISO 8601)")
  .requiredOption("--end-date <iso>", "End date (UTC ISO 8601)")
  .option("--customer <id>", "Filter by customer/group ID")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  postiz-cli posts list --start-date 2024-01-01T00:00:00.000Z --end-date 2024-12-31T23:59:59.000Z --json",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const data = await client.get("/posts", {
        startDate: opts.startDate!,
        endDate: opts.endDate!,
        ...(opts.customer && { customer: opts.customer }),
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

// ── CREATE ────────────────────────────────────────────
postsResource
  .command("create")
  .description("Create or schedule a post (full JSON body or convenience flags)")
  .option("--body <json>", "Full CreatePostRequest JSON")
  .option("--file <path>", "Read CreatePostRequest JSON from a file")
  .option("--type <type>", "Convenience: draft | schedule | now")
  .option("--date <iso>", "Convenience: publish date UTC ISO")
  .option("--integration <id>", "Convenience: integration/channel ID")
  .option("--content <text>", "Convenience: post content")
  .option("--settings-type <type>", "Convenience: settings.__type (e.g. x, linkedin)")
  .option("--short-link", "Convenience: enable short links", false)
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    '\nExamples:\n  postiz-cli posts create --file post.json --json\n  postiz-cli posts create --type schedule --date 2024-12-14T10:00:00.000Z --integration integ_1 --content "Hello" --settings-type x --json',
  )
  .action(async (opts: ActionOpts) => {
    try {
      const fromFile = await loadJsonBody(opts);
      const body = fromFile ?? buildConvenienceBody(opts);
      const data = await client.post("/posts", body);
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DELETE ────────────────────────────────────────────
postsResource
  .command("delete")
  .description("Delete a post by ID (deletes the whole group)")
  .argument("<id>", "Post ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  postiz-cli posts delete post_123")
  .action(async (id: string, opts: ActionOpts) => {
    try {
      await client.delete(`/posts/${encodeURIComponent(id)}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DELETE-GROUP ──────────────────────────────────────
postsResource
  .command("delete-group")
  .description("Delete all posts in a group by group identifier")
  .argument("<group>", "Post group ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  postiz-cli posts delete-group group_123")
  .action(async (group: string, opts: ActionOpts) => {
    try {
      await client.delete(`/posts/group/${encodeURIComponent(group)}`);
      output({ deleted: true, group }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── MISSING ───────────────────────────────────────────
postsResource
  .command("missing")
  .description("Fetch provider content for a post with missing releaseId")
  .argument("<id>", "Post ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  postiz-cli posts missing post_123 --json")
  .action(async (id: string, opts: ActionOpts) => {
    try {
      const data = await client.get(`/posts/${encodeURIComponent(id)}/missing`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── RELEASE-ID ────────────────────────────────────────
postsResource
  .command("release-id")
  .description("Set the platform releaseId for a post currently marked missing")
  .argument("<id>", "Post ID")
  .requiredOption("--release-id <value>", "Platform-specific content ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  postiz-cli posts release-id post_123 --release-id 987654321")
  .action(async (id: string, opts: ActionOpts) => {
    try {
      const data = await client.put(`/posts/${encodeURIComponent(id)}/release-id`, {
        releaseId: opts.releaseId,
      });
      output(data ?? { updated: true, id, releaseId: opts.releaseId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── STATUS ────────────────────────────────────────────
postsResource
  .command("status")
  .description("Change post status between draft and schedule")
  .argument("<id>", "Post ID")
  .requiredOption("--status <status>", "New status: draft | schedule")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  postiz-cli posts status post_123 --status schedule")
  .action(async (id: string, opts: ActionOpts) => {
    try {
      if (opts.status !== "draft" && opts.status !== "schedule") {
        throw new CliError(2, "--status must be 'draft' or 'schedule'");
      }
      const data = await client.put(`/posts/${encodeURIComponent(id)}/status`, {
        status: opts.status,
      });
      output(data ?? { updated: true, id, status: opts.status }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── SETTINGS ──────────────────────────────────────────
postsResource
  .command("settings")
  .description("Merge provider settings into a not-yet-published post")
  .argument("<id>", "Post ID")
  .option("--settings <json>", "Settings object JSON to merge")
  .option("--body <json>", "Full body JSON (must include settings)")
  .option("--file <path>", "Read body/settings JSON from a file")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    '\nExample:\n  postiz-cli posts settings post_123 --settings \'{"who_can_reply_post":"everyone"}\'',
  )
  .action(async (id: string, opts: ActionOpts) => {
    try {
      let settings: Record<string, unknown> | undefined;
      if (opts.settings) {
        settings = JSON.parse(opts.settings) as Record<string, unknown>;
      } else {
        const loaded = await loadJsonBody(opts);
        if (!loaded) {
          throw new CliError(2, "Provide --settings JSON, or --body/--file containing settings");
        }
        if (loaded.settings && typeof loaded.settings === "object") {
          settings = loaded.settings as Record<string, unknown>;
        } else {
          // bare settings object via --body/--file
          settings = loaded;
        }
      }
      const data = await client.put(`/posts/${encodeURIComponent(id)}/settings`, { settings });
      output(data ?? { updated: true, id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
