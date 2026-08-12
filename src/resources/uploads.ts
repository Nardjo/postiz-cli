import { Command } from "commander";
import { basename } from "path";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { CliError, handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  url?: string;
}

export const uploadsResource = new Command("uploads").description(
  "Upload media files for use in posts",
);

// ── FILE ──────────────────────────────────────────────
uploadsResource
  .command("file")
  .description("Upload a local file via multipart form data")
  .argument("<path>", "Path to the file to upload")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  postiz-cli uploads file ./photo.jpg --json")
  .action(async (filePath: string, opts: ActionOpts) => {
    try {
      const file = Bun.file(filePath);
      if (!(await file.exists())) {
        throw new CliError(2, `File not found: ${filePath}`);
      }
      const form = new FormData();
      form.append("file", file, basename(filePath));
      const data = await client.postForm("/upload", form, 120_000);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── URL ───────────────────────────────────────────────
uploadsResource
  .command("url")
  .description("Upload a file from a public URL")
  .requiredOption("--url <url>", "Public URL of the file")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  postiz-cli uploads url --url https://example.com/img.png --json")
  .action(async (opts: ActionOpts) => {
    try {
      if (!opts.url) throw new CliError(2, "--url is required");
      const data = await client.post("/upload-from-url", { url: opts.url });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
