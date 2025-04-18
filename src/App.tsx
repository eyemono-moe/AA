import {
  type Component,
  type JSX,
  createEffect,
  createSignal,
  onCleanup,
} from "solid-js";
import { createStore } from "solid-js/store";
import asciiWorker from "./ascii.worker?worker";
import NumberInput from "./component/NumberInput";

const DEFAULT_CHAR_PALETTE = "*+=-:.' \\|/_^~<>(){}[]EYMONeymon";

const App: Component = () => {
  const [params, setParams] = createStore({
    imageUrl: "",
    lineCount: 30,
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

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setParams("imageUrl", reader.result as string);
      setAscii("");
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload: JSX.ChangeEventHandler<HTMLInputElement, Event> = (
    e,
  ) => {
    const file = e.currentTarget.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  const handlePaste = (e: ClipboardEvent) => {
    const item = Array.from(e.clipboardData?.items || []).find((i) =>
      i.type.startsWith("image"),
    );
    const file = item?.getAsFile();
    if (file) handleFile(file);
  };

  const updateAscii = () => {
    if (!params.imageUrl) return;
    setIsLoading(true);
    worker.postMessage({ ...params });
  };

  createEffect(updateAscii);

  onCleanup(() => worker.terminate());

  return (
    <div
      class="mx-auto flex max-w-screen-md flex-col gap-4 p-6"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onPaste={handlePaste}
    >
      <div class="flex items-center gap-4">
        <label class="cursor-pointer rounded border px-4 py-2 hover:bg-gray-100">
          画像を選択
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            class="hidden"
          />
        </label>
      </div>
      <NumberInput
        label="出力行数"
        min={4}
        max={100}
        step={1}
        value={params.lineCount}
        onChange={(v) => setParams("lineCount", v)}
      />
      <NumberInput
        label="フォントサイズ"
        min={8}
        max={32}
        step={1}
        value={params.fontSize}
        onChange={(v) => setParams("fontSize", v)}
      />
      <NumberInput
        label="行間隔"
        min={1.0}
        max={3.0}
        step={0.1}
        value={params.leading}
        onChange={(v) => setParams("leading", v)}
      />
      <button
        type="button"
        onClick={updateAscii}
        class="rounded bg-black px-4 py-2 text-white shadow hover:bg-gray-800"
      >
        生成
      </button>
      <pre
        class="w-full max-w-full overflow-auto whitespace-pre rounded border bg-white p-3 font-mono text-sm shadow-inner"
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
