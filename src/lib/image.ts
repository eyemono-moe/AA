const measureCharWidth = (
  char: string,
  height: number,
  fontFamily = "monospace",
): number => {
  const canvas = new OffscreenCanvas(height * 2, height * 2);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  ctx.font = `${height}px ${fontFamily}`;
  const metrics = ctx.measureText(char);
  return Math.ceil(metrics.width);
};

const renderCharImage = (
  char: string,
  fontSize: number,
  blockWidth: number,
  blockHeight: number,
  fontFamily = "monospace",
): ImageData => {
  const canvas = new OffscreenCanvas(blockWidth, blockHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, blockWidth, blockHeight);
  ctx.fillStyle = "#000";
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline = "bottom";
  ctx.fillText(char, 0, blockHeight);
  return ctx.getImageData(0, 0, blockWidth, blockHeight);
};

const getCharPaletteImages = (
  palette: string,
  fontSize: number,
  blockWidth: number,
  blockHeight: number,
  fontFamily = "monospace",
) => {
  return palette.split("").map((char) => ({
    char,
    data: renderCharImage(char, fontSize, blockWidth, blockHeight, fontFamily)
      .data,
  }));
};

const computeMSE = (data1: Uint8ClampedArray, data2: Uint8ClampedArray) => {
  let sum = 0;
  for (let i = 0; i < data1.length; i += 4) {
    const diff = data1[i] - data2[i]; // use red channel only (grayscale)
    sum += diff * diff;
  }
  return sum / (data1.length / 4);
};

const findBestMatch = (
  blockData: ImageData,
  palette: { char: string; data: Uint8ClampedArray }[],
) => {
  let minMSE = Number.POSITIVE_INFINITY;
  let bestChar = " ";
  for (const { char, data } of palette) {
    const mse = computeMSE(blockData.data, data);
    if (mse < minMSE) {
      minMSE = mse;
      bestChar = char;
    }
  }
  return bestChar;
};

export const generateAscii = async ({
  imageUrl,
  lineCount,
  fontSize,
  palette,
  fontFamily = "monospace",
  leading = 1.6,
  signal,
}: {
  imageUrl: string;
  lineCount: number;
  fontSize: number;
  palette: string;
  fontFamily?: string;
  leading?: number;
  signal?: AbortSignal;
}) => {
  if (lineCount <= 0) throw new Error("lineCount must be greater than 0");

  const abortPromise = new Promise<undefined>((_, reject) => {
    signal?.addEventListener("abort", () => {
      reject("Aborted");
    });
  });

  const run = async () => {
    // const img = new Image();
    // img.src = imageUrl;
    // await img.decode();
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const img = await createImageBitmap(blob);

    const blockWidth = measureCharWidth("M", fontSize);
    const blockHeight = Math.round(fontSize * leading);

    const aspectRatio = img.width / img.height;
    const resizeHeight = lineCount * blockHeight;
    const rowCount = Math.round((resizeHeight * aspectRatio) / blockWidth);
    const resizeWidth = rowCount * blockWidth;

    const canvas = new OffscreenCanvas(resizeWidth, resizeHeight);
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!ctx) throw new Error("Failed to get canvas context");

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const paletteImages = getCharPaletteImages(
      palette,
      fontSize,
      blockWidth,
      blockHeight,
      fontFamily,
    );
    let result = "";

    for (let y = 0; y < lineCount; y++) {
      for (let x = 0; x < rowCount; x++) {
        const block = ctx.getImageData(
          x * blockWidth,
          y * blockHeight,
          blockWidth,
          blockHeight,
        );
        result += findBestMatch(block, paletteImages);
      }
      result += "\n";
    }

    return result;
  };

  return Promise.race([run(), abortPromise]);
};

export type GenerateAsciiParams = Parameters<typeof generateAscii>[0];
