export default function Shape({ caption, style }) {
  return (
    <div className="shape">
      <div className="box" style={style}></div>
      <span className="cap">{caption}</span>
    </div>
  );
}