"use client";

import type { ImgHTMLAttributes } from "react";
import { PLACEHOLDER_IMAGE } from "@/lib/mockData";

type LocalImageProps = ImgHTMLAttributes<HTMLImageElement>;

export function LocalImage({ src, alt, ...props }: LocalImageProps) {
  return (
    <img
      {...props}
      src={src ?? PLACEHOLDER_IMAGE}
      alt={alt}
      onError={(event) => {
        if (event.currentTarget.src.endsWith(PLACEHOLDER_IMAGE)) return;
        event.currentTarget.src = PLACEHOLDER_IMAGE;
      }}
    />
  );
}
