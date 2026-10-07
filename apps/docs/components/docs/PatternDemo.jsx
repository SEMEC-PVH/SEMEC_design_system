import PreviewFrame from "@/components/docs/PreviewFrame";
import CodeBlock from "@/components/docs/CodeBlock";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import { patterns } from "@/components/demos/patterns/patterns";

/**
 * Exemplo visual de um padrão de UI/UX.
 *
 * Repete, em um único componente, o bloco que as páginas de padrão montavam
 * à mão: título da seção, descrição, preview isolado (iframe com proto.css)
 * e snippet copiável com prompt para o agente. Dentro do iframe a demo é
 * envolvida pelo mesmo wrapper centralizador do BasePreview, senão as raízes
 * com `max-w-*` encostam na borda esquerda.
 *
 * Os metadados (label, descrição, snippet, prompt) vêm de `patterns.js`
 * pela chave `id` — mesma chave usada na rota (`navegacao/cabecalho`).
 * Props explícitas sobrescrevem o que está no registro.
 *
 * Props:
 * - id: string — chave do padrão em `components/demos/patterns/patterns.js`
 * - title / desc / usage / filename / prompt: sobrescritas opcionais
 * - children: ReactNode — demo montada com componentes do kit (client)
 */
export default function PatternDemo({ id, title, desc, usage, filename, prompt, children }) {
  const meta = patterns[id];
  const heading = title || `Exemplo interativo — ${meta?.label ?? id}`;

  return (
    <AnimateOnScroll>
      <h2>{heading}</h2>
      <p>{desc ?? meta?.desc}</p>
      <PreviewFrame>
        <div className="box-border flex min-h-[96px] w-full items-center justify-center overflow-x-clip p-4">
          {children}
        </div>
      </PreviewFrame>
      <CodeBlock
        code={usage ?? meta?.usage}
        filename={filename ?? meta?.filename}
        prompt={prompt ?? meta?.prompt}
      />
    </AnimateOnScroll>
  );
}
