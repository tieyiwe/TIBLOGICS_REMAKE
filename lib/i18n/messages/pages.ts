import type { Messages } from "./types";
import about from "./pages/about";
import services from "./pages/services";
import contact from "./pages/contact";
import api from "./pages/api";
import book from "./pages/book";
import privacy from "./pages/privacy";
import terms from "./pages/terms";
import products from "./pages/products";
import events from "./pages/events";
import store from "./pages/store";

// Namespace "pages". Keys are "pages.something". See lib/i18n/README.md.
//
// The public content pages (about, services, contact, book, legal, products,
// events, store, AI Times) have a lot of copy, so each area
// lives in its own file under ./pages and is merged here.
const PARTS: Messages[] = [about, services, contact, api, book, privacy, terms, products, events, store];

const messages: Messages = { en: {}, fr: {}, sw: {} };
for (const part of PARTS) {
  Object.assign(messages.en, part.en);
  Object.assign(messages.fr, part.fr);
  Object.assign(messages.sw, part.sw);
}

export default messages;
