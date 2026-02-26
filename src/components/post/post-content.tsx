"use client";

import Link from "next/link";
import { parsePostContent } from "@/lib/utils";

export function PostContent({ text }: { text: string }) {
  const segments = parsePostContent(text);

  return (
    <p className="whitespace-pre-wrap break-words text-[15px] leading-5">
      {segments.map((segment, i) => {
        switch (segment.type) {
          case "mention":
            return (
              <Link
                key={i}
                href={`/${segment.value.slice(1)}`}
                className="text-[#1d9bf0] hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {segment.value}
              </Link>
            );
          case "hashtag":
            return (
              <span key={i} className="text-[#1d9bf0]">
                {segment.value}
              </span>
            );
          case "url":
            return (
              <a
                key={i}
                href={segment.value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1d9bf0] hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {segment.value.replace(/^https?:\/\//, "").slice(0, 30)}
                {segment.value.length > 30 ? "..." : ""}
              </a>
            );
          default:
            return <span key={i}>{segment.value}</span>;
        }
      })}
    </p>
  );
}
