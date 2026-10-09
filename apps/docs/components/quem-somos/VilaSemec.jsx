"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import TitleScreen from "./TitleScreen";
import FullscreenButton from "./FullscreenButton";
import { areaOf, CHEFE_POR_AREA, mapaDeLideres } from "./areas";
import { CHEFES, LINGUAGENS } from "./batalha/dados";
import { nomeTipo } from "./batalha/motor";
import { useProgresso } from "./batalha/progresso";
import ModalJornada from "./batalha/ModalJornada";
import EscolhaInicial from "./batalha/EscolhaInicial";
import BatalhaOverlay from "./batalha/BatalhaOverlay";
import { cenaOcarina, cenaVitoria } from "./cenas";
import Retrato, { bocaAberta, useDigitacao } from "./Retrato";
import FichaPersonagem from "./FichaPersonagem";
import { FICHAS, ehFicha } from "./fichas";
import { QUEST, useQuest } from "./quest";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// "Líder do Ginásio Front-End" → "líder do Ginásio Front-End" (no meio da frase,
// sem perder as maiúsculas dos nomes próprios).
const minusculaInicial = (t) => t.charAt(0).toLowerCase() + t.slice(1);

const KEY_DIRS = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};
const ACTION_KEYS = new Set(["Space", "Enter", "NumpadEnter", "KeyZ"]);
// + aproxima, - afasta (mesmo efeito da roda do mouse).
const ZOOM_KEYS = { Equal: 0.88, NumpadAdd: 0.88, Minus: 1 / 0.88, NumpadSubtract: 1 / 0.88 };

const INTRO = [
  {
    title: "Bem-vindo(a) à Vila SEMEC!",
    text: "Somos o time de tecnologia e design por trás do Design System da SEMEC Porto Velho. Construímos estas ferramentas para garantir experiências digitais consistentes e acessíveis para a população.",
  },
  {
    title: "A jornada",
    text: "Toda jornada começa com uma linguagem de programação. Depois, vença os ginásios Front-End, Back-End e de Dados e conquiste uma Stack em cada um. Com as três, você vira Full Stack! Os líderes têm uma estrela no balão. Para começar, fale com a Diretoria, na sede da SEMEC.",
  },
  {
    title: "Como jogar",
    text: "Ande com as setas ou WASD (segure Shift para correr), ou clique no mapa. Fique de frente para alguém e aperte Espaço para conversar. Use a roda do mouse (ou + e -) para aproximar e afastar a câmera.",
  },
];

const SIGN_TEXT = {
  "boas-vindas": {
    title: "Vila SEMEC",
    text: "Onde mora o Design System da SEMEC Porto Velho. Converse com todo o time!",
  },
  diretoria: {
    title: "SEMEC · Diretoria",
    text: "Aqui se decide o rumo do Design System — e quem aprova cada componente novo.",
  },
  rio: {
    title: "Rio Madeira",
    text: "Bonito de ver, perigoso de nadar. Admire da margem.",
  },
  "back-end": {
    title: "Back-End",
    text: "Onde rodam as APIs e os serviços que conectam escolas, secretaria e população — rápidos, estáveis e documentados.",
  },
  "banco-de-dados": {
    title: "Banco de Dados",
    text: "Os dados da rede municipal de ensino, guardados com segurança e tratados conforme a LGPD.",
  },
  "front-end": {
    title: "Front-End",
    text: "Aqui nascem as interfaces e os componentes do Design System — tudo o que a população vê e toca na tela, acessível por padrão.",
  },
};

const CHEFE_POR_ID = Object.fromEntries(CHEFES.map((c) => [c.id, c]));
const GINASIOS = CHEFES.filter((c) => c.id !== "diretoria");
// Sigla visível de cada Stack no HUD (o nome completo vai para o leitor de tela).
const SIGLA_STACK = { front: "FE", back: "BE", dados: "DB", full: "FS" };
// Canções da ocarina do Pedro (cenas.js, cenaOcarina): dois futuros para
// comparar e o passado.
const CANCOES = [
  { epoca: "festa", label: "Tocar: futuro (festa)" },
  { epoca: "futuro", label: "Tocar: futuro (Vila 2030)" },
  { epoca: "passado", label: "Tocar: passado" },
];
// Quanto tempo o painel "Quest concluída" fica no canto depois da entrega (ms).
const QUEST_FEITA_MS = 6000;
// Clique "de teclado" (detail 0) logo depois de as escolhas aparecerem vem da
// mesma tecla que abriu a conversa (Enter repetido, keyup do Espaço): ignora.
const GUARDA_ESCOLHA_MS = 350;

const DPAD = [
  { dir: "up", label: "Andar para cima", glyph: "▲" },
  { dir: "left", label: "Andar para a esquerda", glyph: "◀" },
  { dir: "right", label: "Andar para a direita", glyph: "▶" },
  { dir: "down", label: "Andar para baixo", glyph: "▼" },
];

export default function VilaSemec({ members }) {
  const hostRef = useRef(null);
  const stageRef = useRef(null);
  const engineRef = useRef(null);
  const actionsRef = useRef(null);
  const actionsShownAt = useRef(0);
  const rodadaRef = useRef(0);
  // Índices dos líderes vencidos, para marcar um engine recém-criado.
  const leadersDoneRef = useRef([]);
  const [status, setStatus] = useState("loading");
  // Tela de título ("Começar"): o jogo só abre depois dela; a vila aparece
  // ao fundo em modo vitrine.
  const [started, setStarted] = useState(false);
  // Página do diálogo: { title, text, link?, linkLabel?, actions? }, com
  // actions = [{ label, primary?, onSelect }] (só na última página).
  const [dialog, setDialog] = useState(null);
  const [facing, setFacing] = useState(null);
  const [talked, setTalked] = useState(() => new Set());
  const [focused, setFocused] = useState(false);
  const [clock, setClock] = useState(null);
  // Modal sobre a vila: { tipo: "escolha", diretor } ou
  // { tipo: "batalha", chefeId, chefe, jogador, rodada }.
  const [modal, setModal] = useState(null);
  // Com reduced motion, a fala aparece inteira e o retrato não balança.
  const [movimentoReduzido] = useState(
    () => typeof window !== "undefined" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)
  );
  // Cena em andamento: o palco só aceita avançar a fala ou pular (Esc).
  const [cena, setCena] = useState(false);
  // Ficha aberta (id em FICHAS) ao clicar num personagem ou mascote no mapa.
  // Fica por cima de tudo; um diálogo aberto continua atrás e volta ao fechar.
  const [ficha, setFicha] = useState(null);
  // Ginásio vencido pela primeira vez: a cena roda quando o modal fechar.
  const cenaPendente = useRef(null);

  const { progresso, temInicial, vencidos, liberado, escolherInicial, registrarResultado, recomecar } = useProgresso();
  // Quest da ocarina (quest.js): etapa salva, se o jogador está perto do
  // Pedro (o painel aparece no canto) e o aviso de concluída logo após a entrega.
  const { etapa: questEtapa, avancar: avancarQuest } = useQuest();
  const [questPerto, setQuestPerto] = useState(false);
  const [questFeita, setQuestFeita] = useState(false);
  // Efeitos da cena da ocarina: tom sépia (passado) e relógio correndo.
  const [sepia, setSepia] = useState(false);
  const [relogioCena, setRelogioCena] = useState(null);
  const cenaId = useRef(0);

  // Índice em members → id do chefe (líderes dos ginásios e Diretoria).
  const lideres = useMemo(() => mapaDeLideres(members), [members]);
  const liderDe = useCallback(
    (chefeId) => {
      for (const [i, c] of lideres) if (c === chefeId) return i;
      return -1;
    },
    [lideres]
  );

  const closeDialog = useCallback(() => setDialog(null), []);
  const focusStage = useCallback(() => stageRef.current?.focus({ preventScroll: true }), []);
  // "Agora não": fecha a conversa e devolve o foco ao palco.
  const dismiss = useCallback(() => {
    setDialog(null);
    focusStage();
  }, [focusStage]);

  const abrirBatalha = useCallback(
    (chefeId, liderIndex) => {
      if (!progresso?.jogador) return;
      rodadaRef.current += 1;
      const base = CHEFE_POR_ID[chefeId];
      setDialog(null);
      setModal({
        tipo: "batalha",
        chefeId,
        chefe: { ...base, titulo: members[liderIndex]?.name || base.titulo },
        // Lutador congelado na abertura: o progresso muda no fim da batalha.
        jogador: progresso.jogador,
        rodada: rodadaRef.current,
      });
    },
    [members, progresso]
  );

  const acoesBatalha = useCallback(
    (chefeId, index, label = "Batalhar!") => [
      { label, primary: true, onSelect: () => abrirBatalha(chefeId, index) },
      { label: "Agora não", onSelect: dismiss },
    ],
    [abrirBatalha, dismiss]
  );

  // Abre a escolha da linguagem inicial (modal), entregue pela Diretoria.
  const acaoEscolherLinguagem = useCallback(
    (index) => ({
      label: "Escolher minha linguagem",
      primary: true,
      onSelect: () => {
        setDialog(null);
        setModal({ tipo: "escolha", diretor: index });
      },
    }),
    []
  );

  // "Recomeçar jornada": pede confirmação no próprio diálogo antes de apagar o
  // progresso. "Cancelar" vem primeiro (recebe o foco) e devolve a fala
  // anterior sem mudar nada; nenhuma das duas é a ação principal.
  const pedirRecomeco = useCallback(
    (index, falaAnterior) => {
      const title = falaAnterior.title;
      const falante = falaAnterior.falante;
      setDialog({
        pages: [
          {
            title,
            falante,
            text: "Tem certeza? Você vai perder a sua linguagem, o nível e todas as Stacks conquistadas.",
            actions: [
              { label: "Cancelar", onSelect: () => setDialog({ pages: [falaAnterior], page: 0 }) },
              {
                label: "Sim, recomeçar",
                onSelect: () => {
                  // Limpa o localStorage e o estado: o HUD e os marcadores dos
                  // líderes (efeito de setLeadersDone) voltam ao início.
                  recomecar();
                  avancarQuest("nova");
                  setDialog({
                    pages: [
                      {
                        title,
                        falante,
                        text: "Jornada reiniciada! Quando quiser, escolha a sua primeira linguagem.",
                        actions: [acaoEscolherLinguagem(index), { label: "Agora não", onSelect: dismiss }],
                      },
                    ],
                    page: 0,
                  });
                },
              },
            ],
          },
        ],
        page: 0,
      });
    },
    [recomecar, avancarQuest, acaoEscolherLinguagem, dismiss]
  );

  // Fala de quem é líder (ginásio ou Diretoria), conforme o progresso.
  const falaDeLider = useCallback(
    (index, chefeId, jaApresentou = false) => {
      const m = members[index];
      const chefe = CHEFE_POR_ID[chefeId];
      const base = {
        title: `${m.name} · ${chefe.titulo}`,
        falante: index,
        ficha: m.retrato,
        link: m.linkedin,
        linkLabel: `LinkedIn de ${m.name}`,
      };
      const venceu = vencidos.includes(chefeId);

      if (chefeId === "diretoria") {
        const intro = jaApresentou ? "" : `Olá! Eu sou ${m.name}, ${m.role} aqui na SEMEC. `;
        if (!temInicial) {
          return {
            ...base,
            text: `${intro}Para fazer parte do time, você vai precisar de uma companheira de jornada: uma linguagem de programação. Vamos escolher a sua?`,
            actions: [acaoEscolherLinguagem(index), { label: "Agora não", onSelect: dismiss }],
          };
        }
        // Com linguagem, toda fala da Diretoria oferece recomeçar a jornada
        // (depois das ações da fala; sem ações, entra um "Fechar" antes).
        const comRecomeco = (fala) => {
          const completa = {
            ...fala,
            actions: [
              ...(fala.actions ?? [{ label: "Fechar", onSelect: dismiss }]),
              { label: "Recomeçar jornada", onSelect: () => pedirRecomeco(index, completa) },
            ],
          };
          return completa;
        };
        if (venceu) {
          return comRecomeco({
            ...base,
            text: "Parabéns, Full Stack! Você venceu os três ginásios e a Diretoria. Quer uma revanche?",
            actions: acoesBatalha(chefeId, index, "Revanche"),
          });
        }
        if (!vencidos.includes("database")) {
          const faltam = GINASIOS.filter((c) => !vencidos.includes(c.id)).length;
          const proximo = GINASIOS.find((c) => !vencidos.includes(c.id) && liberado(c.id));
          const lider = proximo ? members[liderDe(proximo.id)] : null;
          const dica = proximo ? ` Seu próximo desafio é o ${proximo.ginasio}${lider ? `, com ${lider.name}` : ""}.` : "";
          const falta = faltam === 1 ? "Falta 1 Stack" : `Faltam ${faltam} Stacks`;
          return comRecomeco({ ...base, text: `${intro}Continue firme! ${falta} para você virar Full Stack.${dica}` });
        }
        return comRecomeco({ ...base, text: `${chefe.falaInicio} Dica: ${chefe.dica}`, actions: acoesBatalha(chefeId, index) });
      }

      // Líder de ginásio.
      if (!temInicial) {
        return {
          ...base,
          text: "Você ainda não tem uma linguagem de programação. A Diretoria, na sede da SEMEC, entrega a sua primeira!",
        };
      }
      if (venceu) {
        return { ...base, text: `Você já tem a ${chefe.stack.nome}! Revanche?`, actions: acoesBatalha(chefeId, index, "Revanche") };
      }
      if (!liberado(chefeId)) {
        const requer = CHEFE_POR_ID[chefe.requer];
        return { ...base, text: `Volte quando tiver a ${requer?.stack.nome ?? "Stack anterior"}!` };
      }
      return { ...base, text: `${chefe.falaInicio} Dica: ${chefe.dica}`, actions: acoesBatalha(chefeId, index) };
    },
    [members, vencidos, temInicial, liberado, liderDe, acoesBatalha, acaoEscolherLinguagem, pedirRecomeco, dismiss]
  );

  // Pedro toca a ocarina: cena da viagem no tempo (cenas.js, cenaOcarina).
  const tocarOcarina = useCallback(
    (epoca) => {
      const engine = engineRef.current;
      const pedroIndex = members.findIndex((m) => m.quest);
      const passos = pedroIndex >= 0 ? cenaOcarina({ epoca, pedro: { index: pedroIndex, name: members[pedroIndex].name } }) : null;
      setDialog(null);
      if (!engine || !passos) return;
      const id = ++cenaId.current;
      setCena(true);
      engine.playCutscene(passos).then(() => {
        if (id !== cenaId.current) return;
        setCena(false);
        setDialog(null);
        setSepia(false);
        setRelogioCena(null);
        focusStage();
      });
    },
    [members, focusStage]
  );
  const acoesOcarina = useCallback(
    () => [...CANCOES.map((c) => ({ label: c.label, onSelect: () => tocarOcarina(c.epoca) })), { label: "Agora não", onSelect: dismiss }],
    [tocarOcarina, dismiss]
  );

  // Fala do Pedro (quest da ocarina), conforme a etapa.
  const falaDaQuest = useCallback(
    (index, primeiraConversa) => {
      const m = members[index];
      const base = { title: m.name, falante: index, ficha: m.retrato, link: m.linkedin, linkLabel: `LinkedIn de ${m.name}` };
      const apresentacao =
        primeiraConversa && m.fala ? [{ title: m.name, falante: index, text: `Olá! Eu sou ${m.name}, ${m.role}. ${m.fala}` }] : [];
      const fala = (text, actions) => ({ ...base, text, actions });
      if (questEtapa === "nova") {
        const aceitar = {
          label: "Aceitar quest",
          primary: true,
          onSelect: () => {
            avancarQuest("procurando");
            setDialog({
              pages: [
                fala(
                  "Valeu demais! Eu estava tocando no parque perto do Back-End, a sudeste daqui. Procure no mato alto de lá: quando achar, traga a ocarina de volta para mim."
                ),
              ],
              page: 0,
            });
          },
        };
        return [
          ...apresentacao,
          fala(
            "Ai, que desastre... Perdi a minha ocarina azul! Sem ela não tem música nem dança. Você me ajuda a procurar? Tenho uma Stack especial para quem encontrar.",
            [aceitar, { label: "Agora não", onSelect: dismiss }]
          ),
        ];
      }
      if (questEtapa === "procurando") {
        return [
          ...apresentacao,
          fala("Ainda nada da ocarina? Ela caiu no mato alto do parque perto do Back-End. Ande pelo capim de lá que você acha!"),
        ];
      }
      if (questEtapa === "achou") {
        const devolver = {
          label: "Devolver a ocarina",
          primary: true,
          onSelect: () => {
            avancarQuest("concluida");
            engineRef.current?.setQuest("concluida", { celebrar: true });
            setQuestFeita(true);
            setDialog({
              pages: [
                fala(`Minha ocarina! Muito obrigado! Como prometido, aqui está a sua recompensa: a ${QUEST.recompensa.nome}.`),
                fala(
                  "E essa ocarina não é qualquer uma: as canções dela mexem com o tempo. Quer ouvir? Escolha para onde vamos.",
                  acoesOcarina()
                ),
              ],
              page: 0,
            });
          },
        };
        return [...apresentacao, fala("Espera... isso na sua mochila é a minha ocarina?!", [devolver])];
      }
      return [
        ...apresentacao,
        fala("Obrigado de novo pela ajuda! Quer ouvir a ocarina? Cada canção leva a Vila para outro tempo.", acoesOcarina()),
      ];
    },
    [members, questEtapa, avancarQuest, acoesOcarina, dismiss]
  );

  const openNpc = useCallback(
    (index) => {
      const m = members[index];
      if (!m) return;
      const primeiraConversa = !talked.has(index);
      setTalked((prev) => new Set(prev).add(index));
      if (m.quest) {
        setDialog({ pages: falaDaQuest(index, primeiraConversa), page: 0 });
        return;
      }
      const chefeId = lideres.get(index);
      if (chefeId) {
        // Na primeira conversa, a pessoa se apresenta antes do assunto da jornada.
        const apresentacao =
          primeiraConversa && m.fala
            ? [{ title: m.name, falante: index, text: `Olá! Eu sou ${m.name}, ${m.role}. ${m.fala}` }]
            : [];
        setDialog({ pages: [...apresentacao, falaDeLider(index, chefeId, apresentacao.length > 0)], page: 0 });
        return;
      }
      // Demais pessoas: apresentação + quem lidera a área, se houver.
      let text = `Olá! Eu sou ${m.name}, ${m.role} aqui na SEMEC.${m.fala ? ` ${m.fala}` : ""}`;
      const chefeArea = m.group === "interns" ? CHEFE_POR_AREA[areaOf(m.role)] : null;
      const liderIndex = chefeArea ? liderDe(chefeArea) : -1;
      if (liderIndex >= 0) {
        text += ` Quer batalhar? Fale com ${members[liderIndex].name}, ${minusculaInicial(CHEFE_POR_ID[chefeArea].titulo)}.`;
      }
      setDialog({
        pages: [{ title: m.name, falante: index, ficha: m.retrato, text, link: m.linkedin, linkLabel: `LinkedIn de ${m.name}` }],
        page: 0,
      });
    },
    [members, lideres, liderDe, falaDeLider, falaDaQuest, talked]
  );

  const escolher = useCallback(
    (especieId) => {
      escolherInicial(especieId);
      const diretor = modal?.tipo === "escolha" ? members[modal.diretor] : null;
      const front = liderDe("frontend");
      const onde = front >= 0 ? `: fale com ${members[front].name}, na frente do prédio` : "";
      setModal(null);
      setDialog({
        pages: [
          {
            title: diretor ? diretor.name : "Diretoria",
            falante: diretor ? modal.diretor : undefined,
            text: `Ótima escolha! ${LINGUAGENS[especieId]?.nome ?? "A sua linguagem"} vai com você. Comece pelo Ginásio Front-End${onde}. Lá você conquista a sua primeira Stack.`,
          },
        ],
        page: 0,
      });
    },
    [escolherInicial, members, modal, liderDe]
  );

  const fecharModal = useCallback(() => setModal(null), []);

  const onInteractRef = useRef(null);
  useEffect(() => {
    onInteractRef.current = (ev) => {
      if (ev.type === "npc") openNpc(ev.index);
      else if (SIGN_TEXT[ev.id]) setDialog({ pages: [SIGN_TEXT[ev.id]], page: 0 });
    };
  }, [openNpc]);

  // Pisou na ocarina (o motor já mostra ela subindo): avisa e manda devolver.
  const onQuestFindRef = useRef(null);
  useEffect(() => {
    onQuestFindRef.current = () => {
      avancarQuest("achou");
      setDialog({
        pages: [
          {
            title: "Ocarina encontrada!",
            text: "Você achou a ocarina azul do Pedro no meio do mato! Leve de volta para ele, na frente da SEMEC.",
          },
        ],
        page: 0,
      });
    };
  }, [avancarQuest]);

  // Clique num personagem/mascote: abre a ficha. Ignora ids desconhecidos e
  // os cliques na tela de título, durante cenas e com modal aberto.
  const onInspectRef = useRef(null);
  useEffect(() => {
    onInspectRef.current = (ev) => {
      if (!started || cena || modal || !ehFicha(ev?.id)) return;
      setFicha(ev.id);
    };
  }, [started, cena, modal]);

  useEffect(() => {
    let engine = null;
    let cancelled = false;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    import("./vila-engine")
      .then(({ createVila }) => {
        if (cancelled || !hostRef.current) return;
        engine = createVila(hostRef.current, {
          members,
          leaders: new Set(mapaDeLideres(members).keys()),
          reducedMotion,
          modelUrl: `${basePath}/quem-somos/gava.glb`,
          onInteract: (ev) => onInteractRef.current?.(ev),
          onInspect: (ev) => onInspectRef.current?.(ev),
          onFacing: setFacing,
          onReady: () => setStatus("ready"),
          onClock: setClock,
          onCutsceneSay: (fala) => setDialog({ pages: [fala], page: 0, cena: true }),
          onQuestNear: setQuestPerto,
          onQuestFind: () => onQuestFindRef.current?.(),
          onCutsceneEfeito: (cmd) => {
            if (cmd.efeito === "sepia") setSepia(Boolean(cmd.on));
            else if (cmd.efeito === "relogio") setRelogioCena(cmd.on ? { sentido: cmd.sentido } : null);
          },
        });
        engineRef.current = engine;
        engine.setPaused(true);
        // Engine recriado (ex.: recarga a quente) já nasce com os "✓" certos.
        engine.setLeadersDone(leadersDoneRef.current);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      engineRef.current = null;
      engine?.dispose();
    };
  }, [members]);

  useEffect(() => {
    engineRef.current?.setPaused(!started || Boolean(dialog) || Boolean(modal) || Boolean(ficha));
    engineRef.current?.setAttract(!started);
  }, [started, dialog, modal, ficha, status]);

  // Fechou a ficha: o foco volta ao palco. Roda depois da limpeza da ficha,
  // que tira o `inert` do palco.
  // Aberta pelo "Ver ficha" do diálogo, o foco volta para esse botão (o
  // diálogo continua aberto atrás); pelo clique no mapa, volta ao palco.
  const hadFicha = useRef(false);
  useEffect(() => {
    if (ficha) {
      hadFicha.current = true;
    } else if (hadFicha.current) {
      hadFicha.current = false;
      const origem = actionsRef.current?.querySelector("[data-ficha]");
      if (origem) origem.focus({ preventScroll: true });
      else focusStage();
    }
  }, [ficha, focusStage]);
  const fecharFicha = useCallback(() => setFicha(null), []);

  // Etapa da quest no mapa: símbolo sobre o Pedro, ocarina no mato.
  useEffect(() => {
    engineRef.current?.setQuest(questEtapa);
  }, [questEtapa, status]);

  // "Quest concluída" fica alguns segundos no canto e some.
  useEffect(() => {
    if (!questFeita) return undefined;
    const t = setTimeout(() => setQuestFeita(false), QUEST_FEITA_MS);
    return () => clearTimeout(t);
  }, [questFeita]);

  // Líderes vencidos: a estrela do balão vira "✓".
  useEffect(() => {
    const done = [];
    for (const [i, c] of lideres) if (vencidos.includes(c)) done.push(i);
    leadersDoneRef.current = done;
    engineRef.current?.setLeadersDone(done);
  }, [lideres, vencidos, status]);

  // Fechou o modal (escolha ou batalha): o foco volta ao palco e o jogo segue.
  // Roda depois da limpeza do ModalJornada, que tenta devolver o foco ao botão
  // que o abriu (já removido da tela).
  const hadModal = useRef(false);
  const tocarCena = useCallback(
    (chefeId) => {
      const engine = engineRef.current;
      const liderIndex = liderDe(chefeId);
      const seguinte = CHEFES.find((c) => c.requer === chefeId);
      const proximoIndex = seguinte ? liderDe(seguinte.id) : -1;
      const passos = cenaVitoria({
        chefeId,
        lider: liderIndex >= 0 ? { index: liderIndex, name: members[liderIndex].name } : null,
        proximo: proximoIndex >= 0 ? { index: proximoIndex, name: members[proximoIndex].name } : null,
        vencidos,
      });
      if (!engine || !passos) return;
      const id = ++cenaId.current;
      setCena(true);
      engine.playCutscene(passos).then(() => {
        // Uma cena interrompida por outra não desliga a nova.
        if (id !== cenaId.current) return;
        setCena(false);
        setDialog(null);
        focusStage();
      });
    },
    [liderDe, members, vencidos, focusStage]
  );
  useEffect(() => {
    if (modal) {
      hadModal.current = true;
    } else if (hadModal.current) {
      hadModal.current = false;
      focusStage();
      const pendente = cenaPendente.current;
      cenaPendente.current = null;
      if (pendente) tocarCena(pendente);
    }
  }, [modal, focusStage, tocarCena]);

  const pularCena = useCallback(() => {
    engineRef.current?.skipCutscene();
  }, []);

  const startGame = useCallback(() => {
    setStarted(true);
    setDialog({ pages: INTRO, page: 0 });
    stageRef.current?.focus({ preventScroll: true });
  }, []);

  // Enter na tela de título começa o jogo (como "Press Start"), exceto quando
  // o foco está num campo, link ou botão — esses tratam a própria tecla.
  useEffect(() => {
    if (started) return undefined;
    const onKey = (e) => {
      if (e.key !== "Enter" || e.repeat) return;
      if (e.target.closest?.("input, textarea, select, button, a, [contenteditable='true']")) return;
      e.preventDefault();
      startGame();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, startGame]);

  const current = dialog ? dialog.pages[dialog.page] : null;
  const isLastPage = dialog ? dialog.page === dialog.pages.length - 1 : false;
  const digitacao = useDigitacao(current?.text, current, movimentoReduzido);
  // As escolhas só aparecem depois que a fala termina de ser "digitada".
  // Quem tem ficha (membro com `retrato` em FICHAS) ganha "Ver ficha" no fim
  // das escolhas; sem ações próprias, a fala ganha um "Fechar" antes dela.
  const fichaDaFala = current && ehFicha(current.ficha) ? current.ficha : null;
  const proprias = current?.actions?.length ? current.actions : null;
  const mostrarEscolhas = Boolean(current && isLastPage && digitacao.pronto && (proprias || fichaDaFala));
  let choices = mostrarEscolhas ? proprias : null;
  if (mostrarEscolhas && fichaDaFala) {
    choices = [
      ...(proprias ?? [{ label: "Fechar", fechar: true }]),
      { label: "Ver ficha", ficha: fichaDaFala },
    ];
  }
  const falante = current && Number.isInteger(current.falante) ? members[current.falante] : null;

  const focusChoices = useCallback(() => {
    actionsRef.current?.querySelector("button")?.focus({ preventScroll: true });
  }, []);

  // Escolhas visíveis: o foco vai para a primeira.
  // (Depende da fala, não do array: "Ver ficha" o recria a cada render.)
  useEffect(() => {
    if (!mostrarEscolhas) return;
    actionsShownAt.current = performance.now();
    focusChoices();
  }, [mostrarEscolhas, current, focusChoices]);

  // Esc fecha o diálogo também com o foco fora do palco (nas escolhas ou no
  // link). Com modal aberto, quem trata o Esc é o próprio modal.
  useEffect(() => {
    if (!dialog || modal || ficha) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape" || e.target === stageRef.current) return;
      if (!e.target.closest?.(".vila")) return;
      e.preventDefault();
      if (cena) pularCena();
      setDialog(null);
      focusStage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, modal, ficha, cena, pularCena, focusStage]);

  const advance = useCallback(() => {
    // Fala ainda aparecendo: o primeiro toque completa o texto.
    if (!digitacao.pronto) {
      digitacao.completar();
      return;
    }
    // Na página com escolhas, avançar não pula a escolha: leva o foco a ela.
    if (choices) {
      focusChoices();
      return;
    }
    // Última fala de uma cena: a cena segue para o próximo passo.
    if (dialog?.cena && dialog.page === dialog.pages.length - 1) {
      setDialog(null);
      engineRef.current?.continueCutscene();
      return;
    }
    setDialog((d) => (d && d.page < d.pages.length - 1 ? { ...d, page: d.page + 1 } : null));
  }, [choices, focusChoices, dialog, digitacao]);

  const onKeyDown = (e) => {
    const engine = engineRef.current;
    // Modal ou ficha aberta: o palco não reage a nada.
    if (modal || ficha) return;
    if (cena) {
      if (KEY_DIRS[e.code] || ACTION_KEYS.has(e.code) || e.code === "Escape") e.preventDefault();
      if (e.repeat) return;
      if (e.code === "Escape") pularCena();
      else if (dialog && ACTION_KEYS.has(e.code)) advance();
      return;
    }
    if (dialog) {
      if (KEY_DIRS[e.code]) e.preventDefault();
      if (e.repeat) return;
      if (ACTION_KEYS.has(e.code)) {
        e.preventDefault();
        advance();
      } else if (e.code === "Escape") {
        e.preventDefault();
        closeDialog();
      }
      return;
    }
    if (!engine) return;
    if (ZOOM_KEYS[e.code]) {
      e.preventDefault();
      engine.zoomBy(ZOOM_KEYS[e.code]);
      return;
    }
    const dir = KEY_DIRS[e.code];
    if (dir) {
      e.preventDefault();
      if (!e.repeat) engine.press(dir);
    } else if (ACTION_KEYS.has(e.code)) {
      e.preventDefault();
      if (!e.repeat) engine.interact();
    } else if (e.key === "Shift") {
      engine.setRun(true);
    }
  };

  // Roda do mouse: para frente aproxima, para trás afasta. Só com o jogo em
  // foco (jogando); fora dele, a roda continua rolando a página até a lista.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !started) return undefined;
    const onWheel = (e) => {
      if (document.activeElement !== stage || modal || ficha || cena || e.ctrlKey) return;
      e.preventDefault();
      // Proporcional ao giro: o touchpad manda vários passos pequenos.
      const passo = Math.max(-120, Math.min(120, e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY));
      engineRef.current?.zoomBy(Math.exp(passo * 0.0012));
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [started, modal, ficha, cena]);

  const onKeyUp = (e) => {
    const engine = engineRef.current;
    if (!engine) return;
    const dir = KEY_DIRS[e.code];
    if (dir) engine.release(dir);
    else if (e.key === "Shift") engine.setRun(false);
  };

  const onBlur = () => {
    setFocused(false);
    engineRef.current?.releaseAll();
  };

  const finishDialog = () => {
    advance();
    focusStage();
  };

  const selectChoice = (action) => (e) => {
    // Clique de teclado vindo da mesma tecla que abriu a conversa: ignora.
    if (e.detail === 0 && performance.now() - actionsShownAt.current < GUARDA_ESCOLHA_MS) return;
    // Ações montadas no render (sem onSelect): "Ver ficha" e o "Fechar" dela.
    if (action.ficha) setFicha(action.ficha);
    else if (action.fechar) dismiss();
    else action.onSelect();
  };

  let hint = "";
  if (cena || ficha) {
    hint = "";
  } else if (!dialog && !modal && facing?.type === "npc" && members[facing.index]) {
    const chefeId = lideres.get(facing.index);
    const papel = chefeId
      ? `, ${minusculaInicial(CHEFE_POR_ID[chefeId].titulo)}`
      : members[facing.index].quest
        ? ` (quest: ${QUEST.titulo})`
        : "";
    hint = `Espaço: falar com ${members[facing.index].name}${papel}`;
  } else if (!dialog && !modal && facing?.type === "sign") {
    hint = "Espaço: ler a placa";
  } else if (!dialog && !modal && facing?.type === "inspect" && ehFicha(facing.id)) {
    hint = `Espaço: ver a ficha de ${FICHAS[facing.id].nome}`;
  }

  const total = members.length;
  const jogador = progresso?.jogador;
  // Painel da quest: ao chegar perto do Pedro, durante a busca e logo depois
  // da entrega.
  const questConcluida = questEtapa === "concluida";
  const mostrarQuest = started && !cena && (questFeita || (!questConcluida && (questPerto || questEtapa !== "nova")));

  return (
    <section className="vila" data-sepia={sepia || undefined} aria-labelledby="vila-titulo">
      {/* `application` é o papel ARIA para uma área que consome as setas
          (o leitor de tela deixa de interceptá-las). O jsx-a11y o trata
          como não interativo, mas ele precisa de foco e de teclado. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      <div tabIndex={0}
        ref={stageRef}
        className="vila-stage"
        role="application"
        aria-roledescription="jogo"
        aria-label="Vila SEMEC: mapa explorável do time"
        aria-describedby="vila-instrucoes"
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onFocus={() => setFocused(true)}
        onBlur={onBlur}
        onPointerDown={() => stageRef.current?.focus()}
      >
        <div ref={hostRef} className="vila-canvas" />
      </div>

      <p id="vila-instrucoes" className="sr-only">
        Use as setas ou W A S D para andar, Shift para correr, Espaço ou Enter
        para conversar, mais e menos (ou a roda do mouse) para aproximar e
        afastar a câmera e Esc para fechar o diálogo. A mesma equipe está
        listada logo abaixo do mapa.
      </p>

      {!started && <TitleScreen onStart={startGame} />}

      {started && !cena && (
        <div className="vila-hud vila-hud--top">
          <div className="vila-panel vila-title">
            <h1 id="vila-titulo">Quem Somos</h1>
            <p className="vila-counter">
              Conversas: <strong>{talked.size}</strong>/{total}
            </p>
            {clock && (
              <p className="vila-clock">
                {clock.night ? <Moon aria-hidden="true" size={14} /> : <Sun aria-hidden="true" size={14} />}
                <span className="sr-only">{clock.night ? "Noite, " : "Dia, "}</span>
                <time>{clock.time}</time>
              </p>
            )}
            {jogador ? (
              <p className="vila-lang">
                <span className="sr-only">Sua linguagem: </span>
                <strong>{jogador.nome}</strong>
                <span className="vila-lang-nivel">Nv {jogador.nivel}</span>
                <span className="vila-lang-tipo">
                  <span className="sr-only">, tipo </span>
                  {nomeTipo(jogador.tipo)}
                </span>
              </p>
            ) : (
              <p className="vila-lang vila-lang--vazia">Sem linguagem ainda</p>
            )}
            <ul className="vila-stacks" aria-label="Stacks">
              {CHEFES.map((c) => {
                const ok = vencidos.includes(c.id);
                return (
                  <li key={c.id} className="vila-stack" data-ok={ok} title={`${c.stack.nome}${ok ? "" : " (ainda não)"}`}>
                    <span aria-hidden="true">{SIGLA_STACK[c.stack.id]}</span>
                    <span className="sr-only">
                      {c.stack.nome}: {ok ? "conquistada" : "ainda não conquistada"}
                    </span>
                  </li>
                );
              })}
              <li
                className="vila-stack vila-stack--especial"
                data-ok={questConcluida}
                title={`${QUEST.recompensa.nome}${questConcluida ? "" : " (ainda não)"}`}
              >
                <span aria-hidden="true">{QUEST.recompensa.sigla}</span>
                <span className="sr-only">
                  {QUEST.recompensa.nome}: {questConcluida ? "conquistada" : "ainda não conquistada"}
                </span>
              </li>
            </ul>
          </div>
          <div className="vila-hud-direita">
            <div className="vila-hud-actions">
              <a className="vila-panel vila-skip" href="#equipe">
                Ver equipe em lista
              </a>
              <FullscreenButton />
            </div>
            {mostrarQuest && (
              <section className="vila-panel vila-quest" data-etapa={questEtapa} aria-labelledby="vila-quest-titulo">
                <p className="vila-quest-tag">
                  {questConcluida ? "Quest concluída" : questEtapa === "nova" ? "Nova quest" : "Quest em andamento"}
                </p>
                <h2 id="vila-quest-titulo" className="vila-quest-titulo">
                  <span className="vila-quest-icone" aria-hidden="true">
                    ◆
                  </span>
                  {QUEST.titulo}
                </h2>
                <p className="vila-quest-objetivo" aria-live="polite">
                  {QUEST.objetivo[questEtapa]}
                </p>
                <p className="vila-quest-recompensa">
                  Recompensa: <strong>{QUEST.recompensa.nome}</strong>
                </p>
              </section>
            )}
          </div>
        </div>
      )}

      {status === "loading" && started && (
        <p className="vila-status" role="status">
          Carregando a vila…
        </p>
      )}
      {status === "error" && (
        <p className="vila-status" role="alert">
          Não foi possível carregar o mapa 3D neste navegador. A equipe está
          listada logo abaixo.
        </p>
      )}

      {cena && relogioCena && clock && (
        <p className="vila-panel vila-cena-relogio" aria-hidden="true">
          <span className="vila-cena-relogio-seta">{relogioCena.sentido < 0 ? "◀◀" : "▶▶"}</span>
          <time>{clock.time}</time>
        </p>
      )}
      {cena && (
        <>
          <div className="vila-cena-barra vila-cena-barra--topo" aria-hidden="true" />
          <div className="vila-cena-barra vila-cena-barra--base" aria-hidden="true" />
          <button type="button" className="vila-panel vila-cena-pular" onClick={pularCena}>
            Pular cena <kbd>Esc</kbd>
          </button>
        </>
      )}

      {status === "ready" && started && !focused && !dialog && !modal && !ficha && !cena && (
        <p className="vila-chip" aria-hidden="true">
          Clique no mapa para jogar
        </p>
      )}
      {hint && (
        <p className="vila-chip vila-chip--hint" aria-hidden="true">
          {hint}
        </p>
      )}
      <p className="sr-only" aria-live="polite">
        {hint}
      </p>

      {current && (
        <div
          className={`vila-dialog${falante ? " vila-dialog--retrato" : ""}`}
          role="region"
          aria-label="Diálogo"
          aria-live="polite"
        >
          {falante && (
            <Retrato
              key={current.falante}
              membro={falante}
              falando={!digitacao.pronto && !movimentoReduzido}
              boca={bocaAberta(digitacao.visivel, digitacao.pronto)}
            />
          )}
          <p className="vila-dialog-title">{current.title}</p>
          {/* O leitor de tela recebe a fala inteira; o texto "digitado" é só visual. */}
          <p className="vila-dialog-text">
            <span className="sr-only">{current.text}</span>
            {/* A fala inteira invisível reserva a altura: a caixa não cresce
                enquanto as letras aparecem. */}
            <span className="vila-dialog-digitacao" aria-hidden="true">
              <span className="vila-dialog-fantasma">{current.text}</span>
              <span>{digitacao.visivel}</span>
            </span>
          </p>
          <div className="vila-dialog-actions" ref={actionsRef}>
            {current.link && (
              <a href={current.link} target="_blank" rel="noopener noreferrer" className="vila-dialog-link" aria-label={current.linkLabel}>
                LinkedIn
              </a>
            )}
            {choices ? (
              choices.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={`vila-dialog-next${action.primary ? " vila-dialog-next--primary" : ""}`}
                  data-ficha={action.ficha ? "" : undefined}
                  onClick={selectChoice(action)}
                  onKeyDown={(e) => {
                    // Tecla segurada não dispara a escolha sozinha.
                    if (e.repeat && (e.key === "Enter" || e.key === " ")) e.preventDefault();
                  }}
                >
                  {action.label}
                </button>
              ))
            ) : (
              <button type="button" className="vila-dialog-next" onClick={finishDialog}>
                {isLastPage && !dialog.cena ? (dialog.pages === INTRO ? "Jogar" : "Fechar") : "Próximo"}
                <span aria-hidden="true"> ▼</span>
              </button>
            )}
          </div>
        </div>
      )}

      {started && !modal && !ficha && !cena && (
        <div className="vila-pad" aria-label="Controles de toque" role="group">
          {DPAD.map(({ dir, label, glyph }) => (
            <button
              key={dir}
              type="button"
              className={`vila-pad-btn vila-pad-btn--${dir}`}
              aria-label={label}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture?.(e.pointerId);
                engineRef.current?.press(dir);
              }}
              onPointerUp={() => engineRef.current?.release(dir)}
              onPointerCancel={() => engineRef.current?.release(dir)}
              onClick={(e) => {
                // Ativação por teclado (detail 0): um passo por clique.
                if (e.detail === 0) engineRef.current?.step(dir);
              }}
            >
              <span aria-hidden="true">{glyph}</span>
            </button>
          ))}
          <button
            type="button"
            className="vila-pad-btn vila-pad-btn--a"
            aria-label={dialog ? "Avançar diálogo" : "Conversar"}
            onClick={() => (dialog ? advance() : engineRef.current?.interact())}
          >
            A
          </button>
        </div>
      )}

      {ficha && <FichaPersonagem id={ficha} onClose={fecharFicha} onChange={setFicha} />}

      {modal?.tipo === "escolha" && (
        <ModalJornada titulo="Escolha a sua linguagem inicial" onFechar={fecharModal}>
          <EscolhaInicial onEscolher={escolher} />
        </ModalJornada>
      )}
      {modal?.tipo === "batalha" && (
        <BatalhaOverlay
          key={modal.rodada}
          chefe={modal.chefe}
          jogador={modal.jogador}
          onFim={(resultado, jogadorFinal) => {
            const primeira = !vencidos.includes(modal.chefeId);
            const retorno = registrarResultado(modal.chefeId, resultado, jogadorFinal);
            if (retorno.venceu && primeira && modal.chefeId !== "diretoria") cenaPendente.current = modal.chefeId;
            return retorno;
          }}
          onFechar={fecharModal}
        />
      )}
    </section>
  );
}
