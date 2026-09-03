/* eslint-disable jsx-a11y/heading-has-content, jsx-a11y/anchor-has-content */
import * as React from "react";

export function useMDXComponents(components) {
  return {
    h1: (props) => <h1 {...props} />,
    h2: (props) => <h2 {...props} />,
    h3: (props) => <h3 {...props} />,
    h4: (props) => <h4 {...props} />,
    p: (props) => <p {...props} />,
    ul: (props) => <ul {...props} />,
    ol: (props) => <ol {...props} />,
    li: (props) => <li {...props} />,
    a: (props) => <a {...props} />,
    code: (props) => <code {...props} />,
    pre: (props) => <pre {...props} />,
    table: (props) => <table {...props} />,
    blockquote: (props) => <blockquote {...props} />,
    ...components,
  };
}
