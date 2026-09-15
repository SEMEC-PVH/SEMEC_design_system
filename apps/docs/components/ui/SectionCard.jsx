import Link from "next/link";

export default function SectionCard({ href, art, title, desc }) {
  return (
    <Link href={href} className="section-card">
      <div className="section-card-art">{art}</div>
      <div className="section-card-body">
        <h5>{title}</h5>
        <p>{desc}</p>
      </div>
    </Link>
  );
}