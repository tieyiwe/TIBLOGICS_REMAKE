"use client";

import dynamic from "next/dynamic";

const EchelonFloat = dynamic(() => import("@/components/public/EchelonFloat"), {
  ssr: false,
  loading: () => null,
});

export default function EchelonFloatClient() {
  return <EchelonFloat />;
}
