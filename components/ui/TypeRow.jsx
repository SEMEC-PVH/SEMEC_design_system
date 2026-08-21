export default function TypeRow({ label, children }) {
  return (
    <div className="type-row">
      <span className="label">{label}</span>
      <span className="sample">{children}</span>
    </div>
  );
}