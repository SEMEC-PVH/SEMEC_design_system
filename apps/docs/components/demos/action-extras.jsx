import CodeBlock from "@/components/docs/CodeBlock";
import PreviewFrame from "@/components/docs/PreviewFrame";
import {
  ButtonAsLink,
  ButtonDestructive,
  ButtonFormFooter,
  ButtonLoading,
  ButtonToolbar,
  IconToolbar,
  LinkInline,
  LinkList,
} from "@/components/demos/examples/button-scenarios";
import {
  buttonAsLinkUsage,
  buttonDestructiveUsage,
  buttonFormFooterUsage,
  buttonLoadingUsage,
  buttonToolbarUsage,
  iconToolbarUsage,
  linkInlineUsage,
  linkListUsage,
} from "@/components/demos/examples/button-scenarios-data";

function Scenario({ title, desc, code, filename, prompt, centered, children }) {
  return (
    <>
      <h4>{title}</h4>
      <p>{desc}</p>
      <PreviewFrame>
        {centered ? (
          <div className="box-border flex min-h-[96px] w-full items-center justify-center overflow-x-clip p-4">
            {children}
          </div>
        ) : (
          <div style={{ padding: "1rem" }}>{children}</div>
        )}
      </PreviewFrame>
      <CodeBlock code={code} filename={filename} prompt={prompt} />
    </>
  );
}

export function BotoesExtras() {
  return (
    <>
      <h3>Exemplos em contexto</h3>
      <Scenario
        title="Rodapé de formulário"
        desc="Uma ação principal, uma secundária que preserva o trabalho e um escape silencioso."
        code={buttonFormFooterUsage}
        filename="ButtonFormFooter.jsx"
        prompt="Crie rodapé de formulário SEMEC com Enviar (primary), Salvar rascunho (outline) e Cancelar (ghost) usando semec-ds-react Button"
      >
        <ButtonFormFooter />
      </Scenario>
      <Scenario
        title="Confirmação destrutiva"
        desc="Ação destrutiva nunca dispara direto — pede confirmação e oferece saída clara."
        code={buttonDestructiveUsage}
        filename="ButtonDestructive.jsx"
        prompt="Crie confirmação de exclusão com Dialog e Button destructive + outline usando semec-ds-react"
      >
        <ButtonDestructive />
      </Scenario>
      <Scenario
        title="Ação com carregamento"
        desc="Com `loading`, o botão mostra o indicador, ignora novos cliques (evita duplo envio) e continua focalizável, sem perder o foco de quem usa teclado."
        code={buttonLoadingUsage}
        filename="ButtonLoading.jsx"
        prompt="Crie botão com estado de carregamento usando a prop loading (e loadingText) do Button do semec-ds-react"
      >
        <ButtonLoading />
      </Scenario>
      <Scenario
        title="Botão como link"
        desc="`asChild` transforma o botão num link com a mesma aparência — útil quando a ação navega."
        code={buttonAsLinkUsage}
        filename="ButtonAsLink.jsx"
        prompt="Crie botão como link usando asChild do semec-ds-react Button"
      >
        <ButtonAsLink />
      </Scenario>
      <Scenario
        title="Barra de ações"
        desc="Primária em destaque, ações auxiliares em outline/ghost no mesmo nível."
        code={buttonToolbarUsage}
        filename="ButtonToolbar.jsx"
        prompt="Crie barra de ações (primária + outline + ghost sm) usando semec-ds-react Button"
      >
        <ButtonToolbar />
      </Scenario>
    </>
  );
}

export function BotaoDeIconeExtras() {
  return (
    <>
      <h3>Exemplos em contexto</h3>
      <Scenario
        centered
        title="Toolbar com tooltip"
        desc="Ícones agrupados na mesma ação de linha; o `label` nomeia cada botão e o tooltip reforça no hover."
        code={iconToolbarUsage}
        filename="IconToolbar.jsx"
        prompt="Crie toolbar de IconButton com Tooltip usando semec-ds-react (label obrigatório)"
      >
        <IconToolbar />
      </Scenario>
      <p style={{ fontSize: "0.8rem", color: "var(--pv-gray-500)" }}>
        Acessibilidade: `IconButton` exige `label` — sem ele, leitores de tela anunciam um
        botão vazio. O `label` vira `aria-label` e `title`.
      </p>
    </>
  );
}

export function LinkExtras() {
  return (
    <>
      <h3>Exemplos em contexto</h3>
      <Scenario
        title="Link dentro do texto"
        desc="Links inline no corpo do parágrafo, com a variante adequada ao contraste do entorno."
        code={linkInlineUsage}
        filename="LinkInline.jsx"
        prompt="Crie links inline em parágrafo com variantes primary/onSurface/muted usando semec-ds-react Link"
      >
        <LinkInline />
      </Scenario>
      <Scenario
        title="Lista de links úteis"
        desc="Navegação vertical de atalhos, com variantes para hierarquia visual."
        code={linkListUsage}
        filename="LinkList.jsx"
        prompt="Crie lista de links úteis com variantes primary/onSurface/muted usando semec-ds-react Link"
      >
        <LinkList />
      </Scenario>
    </>
  );
}