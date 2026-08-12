#!/usr/bin/env bun
import { Command } from "commander";
import { globalFlags } from "./lib/config.js";
import { authCommand } from "./commands/auth.js";
import { integrationsResource } from "./resources/integrations.js";
import { groupsResource } from "./resources/groups.js";
import { postsResource } from "./resources/posts.js";
import { uploadsResource } from "./resources/uploads.js";
import { analyticsResource } from "./resources/analytics.js";
import { notificationsResource } from "./resources/notifications.js";
import { videoResource } from "./resources/video.js";

const program = new Command();

program
  .name("postiz-cli")
  .description("Agent-ready CLI for the Postiz public API")
  .version("0.1.0")
  .option("--json", "Output as JSON", false)
  .option("--format <fmt>", "Output format: text, json, csv, yaml", "text")
  .option("--verbose", "Enable debug logging", false)
  .option("--no-color", "Disable colored output")
  .option("--no-header", "Omit table/csv headers (for piping)")
  .hook("preAction", (_thisCmd, actionCmd) => {
    const root = actionCmd.optsWithGlobals();
    globalFlags.json = root.json ?? false;
    globalFlags.format = root.format ?? "text";
    globalFlags.verbose = root.verbose ?? false;
    globalFlags.noColor = root.color === false;
    globalFlags.noHeader = root.header === false;
  });

// Built-in commands
program.addCommand(authCommand);

// Resources
program.addCommand(integrationsResource);
program.addCommand(groupsResource);
program.addCommand(postsResource);
program.addCommand(uploadsResource);
program.addCommand(analyticsResource);
program.addCommand(notificationsResource);
program.addCommand(videoResource);

program.parse();
