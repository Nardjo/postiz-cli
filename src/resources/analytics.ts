import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  days?: string;
}

export const analyticsResource = new Command("analytics").description(
  "View platform and post analytics",
);

analyticsResource
  .command("platform")
  .description("Get analytics for a connected integration/channel")
  .argument("<id>", "Integration ID")
  .requiredOption("--days <n>", "Number of days to look back (query param: date)")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  postiz-cli analytics platform integ_123 --days 7 --json")
  .action(async (id: string, opts: ActionOpts) => {
    try {
      const data = await client.get(`/analytics/${encodeURIComponent(id)}`, {
        date: opts.days!,
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

analyticsResource
  .command("post")
  .description("Get analytics for a published post")
  .argument("<id>", "Post ID")
  .requiredOption("--days <n>", "Number of days to look back (query param: date)")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  postiz-cli analytics post post_123 --days 30 --json")
  .action(async (id: string, opts: ActionOpts) => {
    try {
      const data = await client.get(`/analytics/post/${encodeURIComponent(id)}`, {
        date: opts.days!,
      });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
