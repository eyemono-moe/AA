import {
  type GenerateAsciiParams,
  generateAscii as generateAsciiCore,
} from "./lib/image";

let lastAbortController: AbortController | null = null;

self.onmessage = async (event: MessageEvent<GenerateAsciiParams>) => {
  if (lastAbortController) {
    lastAbortController.abort();
  }
  lastAbortController = new AbortController();
  const signal = lastAbortController.signal;
  try {
    const result = await generateAsciiCore({ ...event.data, signal });
    self.postMessage({ type: "result", result });
  } catch (err) {
    self.postMessage({ type: "error", message: (err as Error).message });
  }
};
