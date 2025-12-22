import i18n from "i18n";
import path from "path";

i18n.configure({
  locales: ["fr", "en", "de", "it"],
  directory: path.join(process.cwd(), "locales"),
  defaultLocale: "fr",
  cookie: "lang",
  queryParameter: "lang",
  autoReload: true,
  syncFiles: false,
});

export default i18n;
