export default function DemoCard({
  tag,
  green = false,
  badge,
  title,
  description,
  go = "Acessar",
  soon = false,
}) {
  return (
    <div className={"demo-card" + (soon ? " soon" : "")}>
      <div className={"tag" + (green ? " green" : "")}>{tag}</div>
      {badge && <div className="badge">{badge}</div>}
      <div className="title">{title}</div>
      <p>{description}</p>
      <div className="foot">
        <span className="go">{go}</span>
        {!soon && <span className="arrow" aria-hidden="true">→</span>}
      </div>
    </div>
  );
}