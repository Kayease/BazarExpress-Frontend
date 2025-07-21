"use client";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import React from "react";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export default function RichTextEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <ReactQuill value={value} onChange={onChange} theme="snow" />;
} 