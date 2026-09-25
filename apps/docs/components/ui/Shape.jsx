export default function Shape({ caption, style, className }) {
  return (
    <div className="shape">
      <div className={"box" + (className ? " " + className : "")} style={style}></div>
      <span className="cap">{caption}</span>
    </div>
  );
}