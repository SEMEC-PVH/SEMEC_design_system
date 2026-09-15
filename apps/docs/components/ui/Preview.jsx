export default function Preview({ children, note }) {
  return (
    <>
      <div className="preview">{children}</div>
      {note && (
        <p style={{ fontSize: "0.8rem", color: "var(--pv-gray-500)" }}>
          {note}
        </p>
      )}
    </>
  );
}