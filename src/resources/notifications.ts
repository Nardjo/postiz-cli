import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  fields?: string;
  page?: string;
}

export const notificationsResource = new Command("notifications").description(
  "View organization notifications",
);

notificationsResource
  .command("list")
  .description("List notifications (100 per page, newest first)")
  .option("--page <n>", "Page number (0-based)", "0")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  postiz-cli notifications list --page 0 --json")
  .action(async (opts: ActionOpts) => {
    try {
      const data = await client.get("/notifications", {
        page: opts.page ?? "0",
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
