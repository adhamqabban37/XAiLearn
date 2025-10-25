import { githubModelsChatStream } from "./githubModels";
import { deepseekGenerateStream } from "./deepseek";
import { ollamaGenerateStream } from "./ollama";

type StreamGen = ReturnType<typeof githubModelsChatStream>;

export function aiGenerateStream(
  prompt: string,
  opts: { system?: string; timeout?: number; model?: string } = {}
): AsyncGenerator<string> {
  const provider = (process.env.AI_PROVIDER || "github").toLowerCase();
  if (provider === "github") {
    return githubModelsChatStream(prompt, opts) as StreamGen;
  }
  if (provider === "deepseek") {
    return deepseekGenerateStream(prompt, opts) as StreamGen;
  }
  // default to ollama
  return ollamaGenerateStream(prompt, opts) as StreamGen;
}
