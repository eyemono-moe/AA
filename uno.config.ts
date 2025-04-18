import presetWind4 from "@unocss/preset-wind4";
import {
  defineConfig,
  presetIcons,
  presetTypography,
  presetWebFonts,
  transformerVariantGroup,
} from "unocss";

export default defineConfig({
  presets: [
    presetWind4(),
    presetIcons({
      autoInstall: true,
    }),
    presetTypography(),
    presetWebFonts({
      provider: "google",
      fonts: {
        sans: "Noto Sans JP:400,700",
      },
    }),
  ],
  transformers: [transformerVariantGroup()],
});
