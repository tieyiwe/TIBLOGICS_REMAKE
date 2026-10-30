import { jsonLdDocument, serializeJsonLd, type JsonLdNode } from "@/lib/seo/jsonld";

/**
 * Structured data for the page. A plain <script> (not next/script): JSON-LD is
 * data, not code. The serializer escapes "<" so database text cannot close
 * the tag.
 */
export default function JsonLd({ data }: { data: JsonLdNode | JsonLdNode[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLdDocument(data)) }}
    />
  );
}
