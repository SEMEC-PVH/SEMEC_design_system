"use client";

export default function AnimateOnScroll({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}) {
  return (
    <Tag
      className={`animate-in${className ? " " + className : ""}`}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </Tag>
  );
}
