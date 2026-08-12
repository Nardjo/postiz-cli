import { Command } from "commander";
import { getToken, setToken, removeToken, hasToken, maskToken } from "../lib/auth.js";
import { client } from "../lib/client.js";
import { log } from "../lib/logger.js";
import { handleError } from "../lib/errors.js";

export const authCommand = new Command("auth").description("Manage API authentication");

authCommand
  .command("set")
  .description("Save your API token")
  .argument("<token>", "Your API token")
  .addHelpText("after", "\nExample:\n  postiz-cli auth set sk-abc123xyz")
  .action((token: string) => {
    setToken(token);
    log.success("Token saved securely");
  });

authCommand
  .command("show")
  .description("Display current token (masked by default)")
  .option("--raw", "Show the full unmasked token")
  .addHelpText("after", "\nExample:\n  postiz-cli auth show\n  postiz-cli auth show --raw")
  .action((opts: { raw?: boolean }) => {
    if (!hasToken()) {
      log.warn("No token configured. Run: postiz-cli auth set <token>");
      return;
    }
    const token = getToken();
    console.log(opts.raw ? token : `Token: ${maskToken(token)}`);
  });

authCommand
  .command("remove")
  .description("Delete the saved token")
  .addHelpText("after", "\nExample:\n  postiz-cli auth remove")
  .action(() => {
    removeToken();
    log.success("Token removed");
  });

authCommand
  .command("test")
  .description("Verify your token works by calling /is-connected")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  postiz-cli auth test")
  .action(async (opts: { json?: boolean }) => {
    try {
      const data = await client.get("/is-connected");
      if (opts.json) {
        console.log(JSON.stringify({ ok: true, data }, null, 2));
      } else {
        log.success("Token is valid");
      }
    } catch (err) {
      handleError(err, opts.json);
    }
  });
