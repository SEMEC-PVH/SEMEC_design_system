export const metadata = { title: "Base (@semec/base)" };

export default function BaseLayout({ children }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/proto/proto.css" />
      <div style={{ fontSize: "0.78rem", margin: "0 0 1.25rem", opacity: 0.8 }}>
        Protótipo — vitrine da <code>@semec/base</code>. Camada isolada
        (<code>public/proto/proto.css</code>), não afeta o CSS do guia.
      </div>
      {children}
    </>
  );
}
