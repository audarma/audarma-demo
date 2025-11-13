import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Audarma Demo - LLM-Powered Translation",
  description: "Live demo of Audarma translating Hacker News stories using Cerebras Qwen models",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
