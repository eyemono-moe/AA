import { type Component, type JSX, createEffect, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import asciiWorker from "./ascii.worker?worker";

const DEFAULT_CHAR_PALETTE = "*+=-:.' \\|/_^~<>(){}[]EYMONeymon";

const App: Component = () => {
  const [params, setParams] = createStore<{
    imageUrl: string;
    lineCount: number;
    fontSize: number;
    palette: string;
    fontFamily: string;
    leading: number;
  }>({
    imageUrl: "",
    lineCount: 40,
    fontSize: 14,
    palette: DEFAULT_CHAR_PALETTE,
    fontFamily: "monospace",
    leading: 1.6,
  });

  const [ascii, setAscii] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);

  const worker = new asciiWorker();
  worker.onmessage = (e) => {
    const { data } = e;
    if (data.type === "result") {
      setAscii(data.result);
      setIsLoading(false);
    }
  };

  const handleImageUpload: JSX.ChangeEventHandler<HTMLInputElement, Event> = (
    e,
  ) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setParams("imageUrl", reader.result as string);
      setAscii("");
    };
    reader.readAsDataURL(file);
  };

  const updateAscii = () => {
    if (params.imageUrl === "") return;

    setIsLoading(true);
    worker.postMessage({ ...params });
  };

  createEffect(() => {
    updateAscii();
  });

  return (
    <div class="flex flex-col items-start gap-4 p-4">
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <label class="flex items-center gap-2">
        出力行数
        <input
          type="range"
          min="4"
          max="100"
          step="1"
          value={params.lineCount}
          onInput={(e) => setParams("lineCount", Number(e.currentTarget.value))}
          class="w-32"
        />
        <input
          type="number"
          min="4"
          max="200"
          value={params.lineCount}
          onInput={(e) => setParams("lineCount", Number(e.currentTarget.value))}
          class="w-16 border px-1"
        />
      </label>
      <label class="flex items-center gap-2">
        行間隔
        <input
          type="range"
          min="1.0"
          max="3.0"
          step="0.1"
          value={params.leading}
          onInput={(e) => setParams("leading", Number(e.currentTarget.value))}
          class="w-32"
        />
        <input
          type="number"
          min="1.0"
          max="3.0"
          step="0.1"
          value={params.leading}
          onInput={(e) => setParams("leading", Number(e.currentTarget.value))}
          class="w-16 border px-1"
        />
      </label>
      <button
        type="button"
        onClick={updateAscii}
        class="rounded bg-gray-700 px-3 py-1 text-white"
      >
        生成
      </button>
      <pre
        class="max-w-full overflow-auto whitespace-pre border bg-white p-2"
        classList={{ "opacity-50": isLoading() }}
        style={{
          "line-height": `${params.fontSize * params.leading}px`,
          "font-size": `${params.fontSize}px`,
          "font-family": params.fontFamily,
          "font-variant-ligatures": "none",
          "font-feature-settings": "normal",
          "font-variant": "normal",
        }}
      >
        {ascii()}
      </pre>
    </div>
  );
};

export default App;
