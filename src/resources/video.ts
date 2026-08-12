import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { CliError, handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  body?: string;
  file?: string;
  functionName?: string;
  identifier?: string;
  params?: string;
}

async function loadJsonBody(opts: ActionOpts): Promise<Record<string, unknown>> {
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
  throw new CliError(2, "Provide --body or --file with the video generation JSON.");
}

export const videoResource = new Command("video").description(
  "AI video generation helpers",
);

videoResource
  .command("generate")
  .description("Generate an AI video (image-text-slides or veo3)")
  .option("--body <json>", "VideoGenerationRequest JSON")
  .option("--file <path>", "Read VideoGenerationRequest JSON from a file")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  postiz-cli video generate --file video.json --json",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const body = await loadJsonBody(opts);
      const data = await client.post("/generate-video", body);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

videoResource
  .command("function")
  .description("Execute a video-related function (e.g. load voices)")
  .requiredOption("--function-name <name>", "Function to execute")
  .requiredOption("--identifier <id>", "Video type identifier")
  .option("--params <json>", "Additional parameters as JSON object")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExample:\n  postiz-cli video function --function-name loadVoices --identifier image-text-slides --json",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const body: Record<string, unknown> = {
        functionName: opts.functionName,
        identifier: opts.identifier,
      };
      if (opts.params) {
        body.params = JSON.parse(opts.params);
      }
      const data = await client.post("/video/function", body);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
