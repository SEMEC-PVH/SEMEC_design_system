"use client";

// Correção de um bug de acessibilidade (quest "bugs" do Rafa, quests-coleta.js).
// Renderizado dentro de <ModalJornada titulo=… onFechar=…>, como a OficinaBike.
// Props: { item, onCorrigido } — item = um de QUESTS_COLETA.bugs.itens. Para
// trocar de bug sem remontar o modal, o pai passa key={item.id} (o estado de
// resposta é por bug).
//
// Fluxo:
// 1. "Antes": onde + problema e a prévia AO VIVO do componente com o bug (HTML
//    de verdade, estilizado com tokens no CSS module).
// 2. Pergunta com 3 rádios nativos e "Corrigir". Errar: "Ainda não…" + dica,
//    sem custo (tenta de novo). Acertar: a prévia "Depois" com os componentes
//    de verdade do kit (semec-ds/react = @semec/ds), o critério WCAG, a
//    explicação e "Continuar" (onCorrigido).
//
// Acessibilidade (WCAG 2.1 AA) — a prévia "Antes" é um exemplo de ERRO de
// propósito, então ela não pode virar um erro de verdade na página:
// - toda prévia "Antes" tem legenda visível "Antes (com bug)" + nota de que é
//   intencionalmente ruim, e o `problema` descreve o bug em texto acessível;
// - ela é `inert` (fora do teclado, do clique e da árvore de acessibilidade):
//   o leitor de tela recebe a descrição em texto (nota + transcrição), não o
//   componente quebrado. Os focáveis dentro dela levam tabIndex -1, para a
//   trava de Tab do ModalJornada (que filtra por tabIndex >= 0) nunca mirar
//   um elemento inerte;
// - contraste: o texto cinza-claro (gray-300 sobre white, ~1,5:1) é uma
//   ilustração decorativa do bug; o mesmo texto aparece logo abaixo, legível
//   (gray-950), na transcrição "O que a placa diz". Assim nenhuma informação
//   depende do texto com contraste baixo (exceção de "pura decoração" do 1.4.3);
// - foco: é a única prévia "Antes" alcançável pelo Tab, para dar para SENTIR o
//   bug ("Use Tab para ver"). O botão perde o próprio contorno (o bug), mas a
//   moldura da prévia ganha um contorno tracejado forte com :focus-within —
//   então o foco real do modal continua visível (2.4.7) e não prende nada:
//   é um botão comum na ordem do Tab, sem ação, descrito por aria-describedby;
// - alt: as fotos do "Antes" ficam dentro da área inerte; o balão simula o que
//   o leitor de tela diria ("imagem"). No "Depois", o cartaz é um role="img"
//   com o nome certo (as fotos internas são decorativas, alt="");
// - o "Depois" fica numa ilha de paleta clara: o tema escuro do site troca os
//   tokens semânticos do kit (--bg, --fg, …) só no :root, então a ilha
//   redeclara esses apelidos com primitivos --pv-* (ver CorrigirBug.module.css);
// - ao acertar, o foco vai para o título do "Depois" (tabIndex -1); o feedback
//   de erro é anunciado por aria-live="polite";
// - rádios nativos (setas trocam, Enter envia), como em campanha/Campanha.jsx.

import { useEffect, useId, useRef, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Link,
} from "semec-ds/react";
import s from "./CorrigirBug.module.css";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const retrato = (id) => `${BASE}/quem-somos/retratos/${id}.webp`;
const FOTOS_CARTAZ = ["gava", "emily", "leo"];

// Dica de quem errou (uma por tipo de bug), sem entregar a resposta.
const DICAS = {
  contraste: "Pense em token de cor, não em tamanho ou estilo da letra.",
  foco: "Quem usa teclado precisa ver o foco sempre, não só com o mouse.",
  alt: "O texto alternativo conta o que a imagem mostra.",
  link: "O texto do link sozinho precisa dizer para onde ele leva.",
  cor: "A cor sozinha não basta: falta algo que dê para ler.",
  label: "O nome do campo precisa continuar visível enquanto a pessoa digita.",
};

// Texto da placa do bug de contraste (repetido legível na transcrição).
const TEXTO_PLACA = "Rio Madeira: proibido nadar depois das 18h.";

// ---- Prévias "Antes" (com o bug, de propósito) ---------------------------

function AntesContraste() {
  return (
    <>
      <div className={s.placa} inert aria-hidden="true">
        <p className={s.placaTitulo}>Aviso</p>
        <p className={s.textoApagado}>{TEXTO_PLACA}</p>
      </div>
      <p className={s.transcricao}>
        <span className={s.transcricaoRotulo}>O que a placa diz:</span> {TEXTO_PLACA}
      </p>
    </>
  );
}

function AntesFoco({ notaId }) {
  return (
    <div className={s.quiosque}>
      <p className={s.quiosqueTitulo}>Quiosque da praça</p>
      <button type="button" className={s.botaoSemFoco} aria-describedby={notaId}>
        Ver horários
      </button>
      <p id={notaId} className={s.nota}>
        Use Tab para ver: o botão não mostra o próprio contorno de foco (o bug). A moldura tracejada em volta da prévia
        aparece só para você não se perder.
      </p>
    </div>
  );
}

function AntesAlt() {
  return (
    <>
      <div className={s.cartaz} inert aria-hidden="true">
        <div className={s.fotos}>
          {FOTOS_CARTAZ.map((id) => (
            // eslint-disable-next-line @next/next/no-img-element -- export estático, sem otimizador de imagem
            <img key={id} src={retrato(id)} alt="" className={s.foto} width={80} height={80} />
          ))}
        </div>
        <p className={s.cartazTexto}>Bem-vindos à SEMEC!</p>
      </div>
      <p className={s.balao}>
        <span className={s.balaoRotulo}>Leitor de tela:</span> “imagem”
      </p>
    </>
  );
}

function AntesLink() {
  return (
    <div className={s.placa} inert aria-hidden="true">
      <p className={s.placaTitulo}>Back-End</p>
      <p className={s.placaTexto}>
        Para integrar seu sistema, <span className={s.linkFalso}>clique aqui</span>.
      </p>
      <p className={s.nota}>Numa lista de links do leitor de tela, ele aparece só como “clique aqui”.</p>
    </div>
  );
}

function AntesCor() {
  return (
    <div className={s.formulario} inert aria-hidden="true">
      <p className={s.campoNome}>CPF do responsável</p>
      <div className={s.campoFalso} data-erro="">
        123.456
      </div>
      <p className={s.nota}>Tem um erro aqui, mas só a borda vermelha avisa.</p>
    </div>
  );
}

function AntesLabel() {
  return (
    <div className={s.formulario} inert aria-hidden="true">
      <div className={s.estados}>
        <div>
          <p className={s.estadoRotulo}>Vazio</p>
          <div className={s.campoFalso} data-placeholder="">
            E-mail
          </div>
        </div>
        <div>
          <p className={s.estadoRotulo}>Digitando</p>
          <div className={s.campoFalso}>maria@</div>
        </div>
      </div>
      <p className={s.nota}>Depois da primeira letra, ninguém sabe mais que campo é esse.</p>
    </div>
  );
}

// ---- Prévias "Depois" (com os componentes do kit) -------------------------

function DepoisContraste() {
  return (
    <Card className={s.cartaoKit}>
      <CardHeader>
        <CardTitle>Aviso</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{TEXTO_PLACA}</p>
      </CardContent>
    </Card>
  );
}

function DepoisFoco() {
  const [horario, setHorario] = useState("");
  return (
    <div className={s.pilha}>
      <p className={s.quiosqueTitulo}>Quiosque da praça</p>
      <Button type="button" onClick={() => setHorario("Aberto das 8h às 18h.")}>
        Ver horários
      </Button>
      <p className={s.nota}>Use Tab: o Button do kit mostra o anel de foco.</p>
      <p className={s.resultado} aria-live="polite">
        {horario}
      </p>
    </div>
  );
}

function DepoisAlt({ alt }) {
  return (
    <div className={s.pilha}>
      <div className={s.cartaz} role="img" aria-label={alt}>
        <div className={s.fotos}>
          {FOTOS_CARTAZ.map((id) => (
            // eslint-disable-next-line @next/next/no-img-element -- export estático, sem otimizador de imagem
            <img key={id} src={retrato(id)} alt="" className={s.foto} width={80} height={80} />
          ))}
        </div>
        <p className={s.cartazTexto} aria-hidden="true">
          Bem-vindos à SEMEC!
        </p>
      </div>
      <p className={s.balao}>
        <span className={s.balaoRotulo}>Leitor de tela:</span> “{alt}, imagem”
      </p>
    </div>
  );
}

function DepoisLink({ destinoId }) {
  return (
    <div className={s.pilha}>
      <p className={s.placaTitulo}>Back-End</p>
      <p className={s.placaTexto}>
        Para integrar seu sistema: <Link href={`#${destinoId}`}>Ver a documentação da API do Back-End</Link>
      </p>
      {/* Destino real do link (na própria prévia), para ele não tirar a pessoa do jogo. */}
      <p id={destinoId} className={s.destino} tabIndex={-1}>
        Documentação da API do Back-End: autenticação, rotas e exemplos de resposta.
      </p>
    </div>
  );
}

function DepoisCor() {
  // role="note": é uma demonstração; com o role="alert" padrão do Alert, ele
  // seria anunciado com urgência no meio do texto da correção.
  return (
    <Alert variant="destructive" role="note">
      <AlertTitle>Confira o CPF</AlertTitle>
      <AlertDescription>O CPF do responsável está incompleto: digite os 11 números.</AlertDescription>
    </Alert>
  );
}

function DepoisLabel() {
  const id = useId();
  return (
    <div className={s.pilha}>
      <Label htmlFor={id}>E-mail</Label>
      <Input id={id} type="email" autoComplete="email" placeholder="nome@exemplo.com" />
    </div>
  );
}

const ANTES = {
  contraste: AntesContraste,
  foco: AntesFoco,
  alt: AntesAlt,
  link: AntesLink,
  cor: AntesCor,
  label: AntesLabel,
};
const DEPOIS = {
  contraste: DepoisContraste,
  foco: DepoisFoco,
  alt: DepoisAlt,
  link: DepoisLink,
  cor: DepoisCor,
  label: DepoisLabel,
};
// Componentes do kit usados em cada "Depois" (mostrado na legenda).
const KIT = {
  contraste: "Card",
  foco: "Button",
  alt: "imagem com nome acessível",
  link: "Link",
  cor: "Alert",
  label: "Label + Input",
};

// Texto do alt certo (a opção correta, sem o alt="…" em volta).
const altCerto = (item) => item.opcoes[item.certa].replace(/^alt="(.*)"$/, "$1");

export default function CorrigirBug({ item, onCorrigido }) {
  const [selecao, setSelecao] = useState(null);
  // n: muda a cada envio, para o aria-live reanunciar até a mesma mensagem.
  const [aviso, setAviso] = useState({ texto: "", n: 0 });
  const [corrigido, setCorrigido] = useState(false);
  const depoisRef = useRef(null);
  const base = useId();
  const notaId = `${base}-nota`;
  // id seguro para usar em href="#…" (o useId pode trazer caracteres especiais).
  const destinoId = `destino-${base.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  // Acertou: o formulário sai da tela, então o foco vai para o título do "Depois".
  useEffect(() => {
    if (corrigido) depoisRef.current?.focus();
  }, [corrigido]);

  const Antes = ANTES[item.bug];
  const Depois = DEPOIS[item.bug];

  const corrigir = (e) => {
    e.preventDefault();
    if (selecao == null) {
      setAviso((a) => ({ texto: "Escolha uma das opções primeiro.", n: a.n + 1 }));
      return;
    }
    if (selecao === item.certa) {
      setAviso((a) => ({ texto: "", n: a.n + 1 }));
      setCorrigido(true);
    } else {
      setAviso((a) => ({ texto: `Ainda não… ${DICAS[item.bug]}`, n: a.n + 1 }));
    }
  };

  return (
    <div className={s.bug}>
      {/* CSS do kit no site (utilities Tailwind dos componentes), como o
          ComponentDoc faz nas páginas de componente: a página da Vila não o
          carrega. Fica montado com o modal (já baixa durante a pergunta) e
          sai junto quando ele fecha. */}
      <link rel="stylesheet" href={`${BASE}/proto/proto.css`} />
      <p className={s.onde}>{item.onde}</p>
      <p className={s.problema}>{item.problema}</p>

      <div className={s.comparacao} data-corrigido={corrigido || undefined}>
        <figure className={s.previa} data-tipo="antes" data-foco={item.bug === "foco" || undefined}>
          <figcaption className={s.legenda}>
            Antes (com bug)
            <span className={s.legendaNota}>Exemplo intencionalmente errado.</span>
          </figcaption>
          <div className={s.palco}>
            <Antes notaId={notaId} />
          </div>
        </figure>

        {corrigido && (
          <figure className={s.previa} data-tipo="depois">
            <figcaption className={s.legenda}>
              <h3 ref={depoisRef} tabIndex={-1} className={s.depoisTitulo}>
                Depois: bug corrigido!
              </h3>
              <span className={s.legendaNota}>Com o kit @semec/ds: {KIT[item.bug]}.</span>
            </figcaption>
            {/* Ilha de paleta clara: os componentes do kit leem os tokens daqui. */}
            <div className={`${s.palco} ${s.ilhaKit}`}>
              <Depois alt={altCerto(item)} destinoId={destinoId} />
            </div>
          </figure>
        )}
      </div>

      {corrigido ? (
        <div className={s.final}>
          <p className={s.wcag}>
            <span className={s.wcagRotulo}>Critério WCAG</span> {item.wcag}
          </p>
          <p className={s.explicacao}>{item.explicacao}</p>
          <button type="button" className={s.botao} onClick={onCorrigido}>
            Continuar
          </button>
        </div>
      ) : (
        <form className={s.pergunta} onSubmit={corrigir}>
          <fieldset className={s.grupo}>
            <legend className={s.perguntaTexto}>{item.pergunta}</legend>
            <div className={s.opcoes}>
              {item.opcoes.map((op, i) => (
                <label key={op} className={s.opcao} data-marcada={selecao === i || undefined}>
                  <input
                    type="radio"
                    className={s.radio}
                    name={`${base}-opcao`}
                    value={i}
                    checked={selecao === i}
                    onChange={() => setSelecao(i)}
                  />
                  <span className={s.opcaoLetra} aria-hidden="true">
                    {"ABC"[i]}
                  </span>
                  <span className={s.opcaoTexto}>{op}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button type="submit" className={s.botao}>
            Corrigir
          </button>
        </form>
      )}

      {/* Região sempre montada; o span novo (key) faz o leitor anunciar de novo. */}
      <p className={s.aviso} aria-live="polite">
        {aviso.texto && <span key={aviso.n}>{aviso.texto}</span>}
      </p>
    </div>
  );
}
