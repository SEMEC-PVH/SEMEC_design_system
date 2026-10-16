import DocsShell from "@/components/docs/DocsShell";
import ReleaseBanner from "@/components/docs/ReleaseBanner";

export default function DocsLayout({ children }) {
  return <DocsShell banner={<ReleaseBanner />}>{children}</DocsShell>;
}
