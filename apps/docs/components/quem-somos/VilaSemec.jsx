"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Bike, Moon, Sun } from "lucide-react";
import TitleScreen from "./TitleScreen";
import TelaCarregamento from "./TelaCarregamento";
import TelaCarregamentoPista from "./TelaCarregamentoPista";
import OficinaBike from "./OficinaBike";
import CorrigirBug from "./CorrigirBug";
import CorridaHud from "./CorridaHud";
import ResultadoCorrida from "./ResultadoCorrida";
import { assinarCorrida, formatarTempo, lerCorrida, lerCorridaServidor, reiniciarCorrida, salvarResultado } from "./corrida";
import { assinarBicicleta, lerBicicleta, salvarBicicleta } from "./bicicleta";
import { arquivoDoJogador, lerJogadorSalvo, salvarJogador } from "./EscolhaPersonagem";
import FullscreenButton from "./FullscreenButton";
import SomButton from "./SomButton";
import { assinarSom, desbloquear, encerrarSom, lerSom } from "./som/som";
import { tocar } from "./som/sfx";
import { encerrarMusica, tocarMusica } from "./som/musica";
import { areaOf, CHEFE_POR_AREA, mapaDeLideres } from "./areas";
import { CHEFES, LINGUAGENS, TREINADORES } from "./batalha/dados";
import { nomeTipo } from "./batalha/motor";
import { useProgresso } from "./batalha/progresso";
import ModalJornada from "./batalha/ModalJornada";
import EscolhaInicial from "./batalha/EscolhaInicial";
import BatalhaOverlay from "./batalha/BatalhaOverlay";
import { cenaColeta, cenaHistoria, cenaOcarina, cenaVitoria } from "./cenas";
import Retrato, { bocaAberta, useDigitacao } from "./Retrato";
import FichaPersonagem from "./FichaPersonagem";
import LivroHistoria from "./LivroHistoria";
import StackDex from "./StackDex";
import QuadroMuseu from "./QuadroMuseu";
import { montarQuadros } from "./museu-dados";
import PainelElevador from "./PainelElevador";
import { FONTE_SEMFAZ, PESSOAS_SEMFAZ, andarPorId } from "./predio/andares";
import Campanha from "./campanha/Campanha";
import { FICHAS, ehFicha } from "./fichas";
import { QUEST, useQuest } from "./quest";
import { IDS_COLETA, QUESTS_COLETA, objetivoColeta, questDoNpc, useQuestsColeta } from "./quests-coleta";
import {
  assinarPreferencia,
  ehLeve,
  lembrarNivelAuto,
  lerPreferencia,
  resolverNivel,
  salvarPreferencia,
} from "./scene/qualidade";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Tela de carregamento inicial: quando aparece o "Continuar mesmo assim".
const CARGA_PULAR_MS = 15000;
// Preparo da Vila (tela "Preparando a Vila"): teto da espera, quando aparece
// o "Jogar agora" (pular a espera) e rótulo de cada fase.
const PREPARO_MAX_MS = 45000;
const PREPARO_PULAR_MS = 8000;
const ROTULO_PREPARO = {
  cargas: "Carregando personagens e prédios",
  compilar: "Preparando os gráficos",
  texturas: "Preparando as texturas",
  render: "Quase lá…",
  predios: "Preparando a SEMEC por dentro",
  pronto: "Pronto!",
};

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
    text: "Ande com as setas ou WASD (segure Shift para correr; conserte a bicicleta do bicicletário da praça do Front-End e use B para subir e descer), ou clique no mapa. Fique de frente para alguém e aperte Espaço para conversar. Use a roda do mouse (ou + e -) para aproximar e afastar a câmera.",
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
  "machine-learning": {
    title: "Laboratório de Machine Learning",
    text: "4º ginásio: aqui os dados viram previsões. Limpar, treinar, testar — e nada de overfitting! Liberado depois da Data Stack.",
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
// Ginásios da trilha do Full Stack (algum `bonus` ficaria de fora).
const GINASIOS = CHEFES.filter((c) => c.id !== "diretoria" && !c.bonus);
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
  // Gráficos (scene/qualidade.js): preferência do menu ("auto" ou um nível) e
  // o nível que o motor está usando agora (o automático pode descer sozinho).
  const graficos = useSyncExternalStore(assinarPreferencia, lerPreferencia, () => "auto");
  const [nivelAtual, setNivelAtual] = useState(null);
  // O Chrome está desenhando pela CPU (sem aceleração de vídeo).
  const [semAceleracao, setSemAceleracao] = useState(false);
  // Tela de título ("Começar"): o jogo só abre depois dela; a vila aparece
  // ao fundo em modo vitrine.
  const [started, setStarted] = useState(false);
  // Personagem do jogador (tela de escolha): o motor nasce com o último
  // escolhido (lembrado no navegador) e troca o boneco se mudar.
  const personagemRef = useRef(null);
  // Montado na bicicleta (o motor avisa; tecla B, botão do HUD ou do toque).
  // A bicicleta só vale depois da oficina do bicicletário (bicicleta.js).
  const [naBike, setNaBike] = useState(false);
  // Corrida na Pista (corrida.js, CorridaHud, ResultadoCorrida): o motor manda
  // os eventos (onCorrida); aqui fica o que o HUD mostra.
  const [corrida, setCorrida] = useState(null); // { fase, n, inicio, tempo, volta, voltas, checkpoint, total }
  const placarCorrida = useSyncExternalStore(assinarCorrida, lerCorrida, lerCorridaServidor);
  const onCorridaRef = useRef(null);
  // Som (som/): preferência "tudo" | "efeitos" | "desligado". O áudio só
  // destrava no 1º clique/tecla (regra dos navegadores); aí a trilha entra.
  // Ao sair da Vila (volta para a equipe), tudo silencia.
  const somPref = useSyncExternalStore(assinarSom, lerSom, () => "tudo");
  const faixaRef = useRef(null);
  useEffect(() => {
    const destravar = () => {
      if (desbloquear()) tocarMusica(faixaRef.current);
    };
    window.addEventListener("pointerdown", destravar, { capture: true });
    window.addEventListener("keydown", destravar, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", destravar, { capture: true });
      window.removeEventListener("keydown", destravar, { capture: true });
      encerrarMusica();
      encerrarSom();
    };
  }, []);
  // Preparo da Vila antes de jogar ({ fase, progresso }, avisado pelo motor) e
  // se o jogador já pediu para começar e está esperando o preparo.
  const [preparo, setPreparo] = useState({ fase: "cargas", progresso: 0 });
  const [aguardandoPreparo, setAguardandoPreparo] = useState(false);
  // Tela de carregamento ao abrir a página: cobre tudo (a tela de título só
  // aparece com a Vila, os gráficos e a entrada da SEMEC prontos). Depois de
  // CARGA_PULAR_MS, "Continuar mesmo assim" deixa seguir sem esperar.
  const [pulouCarga, setPulouCarga] = useState(false);
  const [podePularCarga, setPodePularCarga] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setPodePularCarga(true), CARGA_PULAR_MS);
    return () => clearTimeout(id);
  }, []);
  const [podePularPreparo, setPodePularPreparo] = useState(false);
  const comecandoRef = useRef(false);
  const comecarRef = useRef(null); // começa já (o "Jogar agora")
  const temBicicleta = useSyncExternalStore(assinarBicicleta, lerBicicleta, () => false);
  useEffect(() => {
    engineRef.current?.setBicicletaLiberada(temBicicleta);
  }, [temBicicleta]);
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
  // Quests de coleta do Zé Carlos e da Emily (quests-coleta.js): estado
  // salvo, perto de quem dá cada uma e a recém-concluída (painel no canto).
  const { estados: coletas, aplicar: aplicarColeta, reiniciarTodas: reiniciarColetas } = useQuestsColeta();
  const coletasRef = useRef(coletas);
  useEffect(() => {
    coletasRef.current = coletas;
  }, [coletas]);
  const [coletaPerto, setColetaPerto] = useState({});
  const [coletaFeita, setColetaFeita] = useState(null);
  // Mini game da Emily (campanha/Campanha.jsx) aberto sobre o jogo.
  const [campanhaAberta, setCampanhaAberta] = useState(false);
  // StackDex (coleção das insígnias em tela cheia), aberta pelo ícone do canto.
  const [dexAberta, setDexAberta] = useState(false);
  // Galeria da Equipe (museu dentro da SEMEC): onde o jogador está, fase da
  // íris de entrada/saída e o quadro em close ({ id, estreito }).
  const [local, setLocal] = useState("vila");
  const [transicao, setTransicao] = useState(null); // { fase, para, modo, rotulo }
  // Tela de carregamento da corrida ({ progresso, etapa } ou null): o motor
  // só a chama quando a íris fecha com a pista ainda fria.
  const [cargaPista, setCargaPista] = useState(null);
  const [quadroAberto, setQuadroAberto] = useState(null);
  const [elevadorAberto, setElevadorAberto] = useState(false);
  // Já saiu do prédio alguma vez: a volta à Vila também é anunciada.
  const [voltouDoPredio, setVoltouDoPredio] = useState(false);
  const quadrosMuseu = useMemo(() => montarQuadros(members), [members]);
  // Prédio da SEMFAZ: o andar atual (null na Vila) e quem aparece no painel
  // do close (quadros da Galeria ou as mesas do andar).
  const andarAtual = local === "vila" ? null : andarPorId(local);
  const naGaleria = Boolean(andarAtual?.galeria);
  const itensDoAndar = useMemo(() => {
    if (!andarAtual) return [];
    return andarAtual.galeria ? quadrosMuseu : andarAtual.zonas.flatMap((z) => z.pessoas);
  }, [andarAtual, quadrosMuseu]);
  // A íris some depois de abrir (0,7 s no motor; 0,2 s com movimento
  // reduzido, quando o nome do lugar não pode ficar parado sobre a cena).
  // De elevador, o motor avisa o fim (null) quando o jogador sai da cabine.
  useEffect(() => {
    if (transicao?.fase !== "abrir" || transicao.modo === "elevador") return undefined;
    const ms = movimentoReduzido ? 250 : 800;
    const id = setTimeout(() => setTransicao(null), ms);
    return () => clearTimeout(id);
  }, [transicao, movimentoReduzido]);
  // O ícone que abriu a StackDex recebe o foco de volta.
  const dexOrigemRef = useRef(null);
  const abrirDex = useCallback((ev) => {
    dexOrigemRef.current = ev.currentTarget;
    setDexAberta(true);
  }, []);
  // Efeitos da cena da ocarina: tom sépia (passado) e relógio correndo.
  const [sepia, setSepia] = useState(false);
  const [relogioCena, setRelogioCena] = useState(null);
  // Página do livro na roda de história do Zé (cenas.js, cenaHistoria).
  const [paginaHistoria, setPaginaHistoria] = useState(null);
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

  // Aprendizes do Laboratório de ML (batalha/dados.js, TREINADORES): batalha
  // opcional, sem Stack, com o mesmo modal dos ginásios.
  const abrirTreinador = useCallback(
    (id) => {
      const t = TREINADORES.find((x) => x.id === id);
      if (!t) return;
      const fala = (text, actions) => ({ title: t.titulo, text, ...(actions ? { actions } : {}) });
      const lutar = (label) => ({
        label,
        primary: true,
        onSelect: () => {
          if (!progresso?.jogador) return;
          rodadaRef.current += 1;
          setDialog(null);
          setModal({ tipo: "batalha", chefeId: t.id, chefe: t, jogador: progresso.jogador, rodada: rodadaRef.current });
        },
      });
      const agoraNao = { label: "Agora não", onSelect: dismiss };
      let pages;
      if (!temInicial) {
        pages = [fala(`${t.falaApresentacao} Para batalhar, primeiro pegue a sua linguagem com a Diretoria, lá na SEMEC.`)];
      } else if (vencidos.includes(t.id)) {
        pages = [fala(t.falaRevanche, [lutar("Revanche"), agoraNao])];
      } else {
        pages = [fala(t.falaApresentacao), fala(`${t.falaInicio} Dica: ${t.dica}`, [lutar("Batalhar!"), agoraNao])];
      }
      setDialog({ pages, page: 0 });
    },
    [progresso, temInicial, vencidos, dismiss]
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
                  reiniciarColetas();
                  salvarBicicleta(false);
                  reiniciarCorrida();
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
    [recomecar, avancarQuest, reiniciarColetas, acaoEscolherLinguagem, dismiss]
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
            text: "Parabéns, Full Stack! Você venceu os quatro ginásios e a Diretoria. Quer uma revanche?",
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

  // Entrega de uma quest de coleta: cena (show da Emily ou o livro do Zé) e a
  // Stack especial no fim.
  const entregarColeta = useCallback(
    (id) => {
      const engine = engineRef.current;
      aplicarColeta(id, { tipo: "concluir" });
      setColetaFeita(id);
      setDialog(null);
      tocar("stack");
      if (!engine) return;
      // Quest dada dentro do prédio (o Rafa, na Galeria): as cenas só rodam na
      // Vila, então a entrega é na conversa e o painel mostra a Stack.
      const q = QUESTS_COLETA[id];
      if (q.local) {
        setDialog({
          pages: [
            {
              title: q.nomeNpc,
              falante: { name: q.nomeNpc, retrato: q.npc },
              ficha: q.npc,
              text: `Você corrigiu todos os bugs! Acessibilidade não é enfeite: é o que deixa o serviço da prefeitura chegar a todo mundo. Leve a ${q.recompensa.nome}: ela fica na sua StackDex.`,
            },
          ],
          page: 0,
        });
        return;
      }
      const cenaAtual = ++cenaId.current;
      setCena(true);
      engine.playCutscene(cenaColeta({ quest: QUESTS_COLETA[id] })).then(() => {
        if (cenaAtual !== cenaId.current) return;
        setCena(false);
        // O painel "Quest concluída" aparece depois da cena (e some sozinho).
        setColetaFeita(id);
        setDialog(null);
        focusStage();
      });
    },
    [aplicarColeta, focusStage]
  );

  // Roda de história do Zé Carlos (cenas.js, cenaHistoria), liberada depois
  // da quest das páginas.
  const contarHistoria = useCallback(() => {
    const engine = engineRef.current;
    setDialog(null);
    if (!engine) return;
    const cenaAtual = ++cenaId.current;
    setCena(true);
    engine.playCutscene(cenaHistoria()).then(() => {
      if (cenaAtual !== cenaId.current) return;
      setCena(false);
      setDialog(null);
      setRelogioCena(null);
      setPaginaHistoria(null);
      focusStage();
    });
  }, [focusStage]);

  // Fim do mini game da Emily. Venceu pela 1ª vez: show do microfone e Stack.
  const fimCampanha = useCallback(
    ({ venceu }) => {
      setCampanhaAberta(false);
      const etapa = coletasRef.current.campanha.etapa;
      if (venceu && etapa === "coletando") {
        aplicarColeta("campanha", { tipo: "vencer" });
        entregarColeta("campanha");
        return;
      }
      focusStage();
    },
    [aplicarColeta, entregarColeta, focusStage]
  );
  const sairCampanha = useCallback(() => {
    setCampanhaAberta(false);
    focusStage();
  }, [focusStage]);

  // Fala de quem dá a quest de coleta (Zé Carlos, Emily), conforme a etapa.
  const abrirQuestColeta = useCallback(
    (id) => {
      const q = QUESTS_COLETA[id];
      const est = coletasRef.current[id];
      const fala = (text, actions) => ({
        title: q.nomeNpc,
        falante: { name: q.nomeNpc, retrato: q.npc },
        ficha: q.npc,
        text,
        ...(actions ? { actions } : {}),
      });
      const agoraNao = { label: "Agora não", onSelect: dismiss };
      const aceitar = (resposta) => ({
        label: "Aceitar quest",
        primary: true,
        onSelect: () => {
          aplicarColeta(id, { tipo: "aceitar" });
          tocar("quest-aceita");
          setDialog({ pages: [fala(resposta)], page: 0 });
        },
      });
      const entregar = (label) => ({ label, primary: true, onSelect: () => entregarColeta(id) });
      let pages;
      if (id === "paginas") {
        if (est.etapa === "nova") {
          pages = [
            fala(
              "Olá! Eu sou o Zé Carlos. Este aqui é o meu Livro Sábio... ou o que sobrou dele. Uma ventania arrancou quatro páginas e espalhou tudo pela Vila!"
            ),
            fala(
              "Cada página tem uma pergunta sobre o nosso Design System. Se você achar as páginas e responder certo, elas voltam para o livro. Topa o desafio?",
              [
                aceitar(
                  "Ótimo! As páginas brilham quando estão perto. Olhe ao lado da sede da SEMEC, perto do Back-End, no sul da Vila e lá na borda leste."
                ),
                agoraNao,
              ]
            ),
          ];
        } else if (est.etapa === "coletando") {
          pages = [
            fala(`Já voltaram ${est.itens.length} de ${q.itens.length} páginas. As outras ainda estão voando por aí: procure o brilho!`),
          ];
        } else if (est.etapa === "pronta") {
          pages = [fala("Todas as páginas! Deixa eu colocar de volta no livro...", [entregar("Entregar as páginas")])];
        } else {
          pages = [
            fala("O Livro Sábio está inteirinho, graças a você. E ele guarda uma história que eu adoro contar... Quer ouvir?", [
              { label: "Ouvir uma história", primary: true, onSelect: contarHistoria },
              agoraNao,
            ]),
          ];
        }
      } else if (id === "bugs") {
        // Rafa, na Galeria: apresenta o Design System e dá a caça aos bugs.
        if (est.etapa === "nova") {
          pages = [
            fala(
              "Oi! Eu sou o Rafa, cuido dos componentes do SEMEC Design System. Sabe aquela exposição aqui da Galeria? Botões, cores, alertas, formulários... tudo pronto e acessível para qualquer sistema da prefeitura usar."
            ),
            fala(
              "O problema é que ainda tem tela feita sem o kit por aí, e com bug de acessibilidade: texto que ninguém lê, botão que some no teclado, foto sem descrição... Achei seis! Você me ajuda a corrigir usando o Design System?",
              [
                aceitar(
                  "Valeu! Os bugs brilham em vermelho. Tem quatro lá fora na Vila (perto das placas do Rio Madeira, do Front-End, do Back-End e da entrada), um na recepção do térreo e um no andar da Tecnologia. Chegue perto e aperte Espaço."
                ),
                agoraNao,
              ]
            ),
          ];
        } else if (est.etapa === "coletando") {
          const faltam = q.itens.filter((i) => !est.itens.includes(i.id)).map((i) => i.onde.toLowerCase());
          pages = [
            fala(
              `Já foram ${est.itens.length} de ${q.itens.length}! Ainda faltam: ${faltam.join("; ")}. Os bugs brilham em vermelho: chegue perto e aperte Espaço.`
            ),
          ];
        } else if (est.etapa === "pronta") {
          pages = [fala("Você achou e corrigiu todos os seis! Deixa eu ver...", [entregar("Mostrar as correções")])];
        } else {
          pages = [
            fala(
              "Graças a você, as telas da Vila estão acessíveis! Quando for fazer um sistema novo, comece pelo kit: os componentes já vêm com contraste, foco e rótulos certos."
            ),
          ];
        }
      } else {
        // Emily: mini game "Campanha da SEMEC".
        const jogar = (label) => ({
          label,
          primary: true,
          onSelect: () => {
            aplicarColeta(id, { tipo: "aceitar" });
            setDialog(null);
            setCampanhaAberta(true);
          },
        });
        if (est.etapa === "nova") {
          pages = [
            fala("Oi! Eu sou a Emily, cuido da comunicação da SEMEC. Este é o meu microfone... ele canta lindamente, mas é tímido demais."),
            fala(
              "Tenho três campanhas para colocar no ar e preciso de ajuda para montar os posts: público, canal, título, arte e a descrição da imagem. Se a cidade gostar, aposto que ele cria coragem! Topa?",
              [jogar("Montar as campanhas"), agoraNao]
            ),
          ];
        } else if (est.etapa === "coletando") {
          pages = [fala("Vamos tentar as campanhas de novo? Lembra: falar simples, para quem importa, e que todo mundo consiga ler.", [jogar("Jogar de novo"), agoraNao])];
        } else if (est.etapa === "pronta") {
          pages = [fala("As campanhas estão no ar! Olha só o microfone, todo animado...", [entregar("Comemorar")])];
        } else {
          pages = [
            fala("Depois daquele show ele não para de cantar! Quer montar as campanhas de novo, só pela diversão?", [
              { label: "Jogar de novo", primary: true, onSelect: () => { setDialog(null); setCampanhaAberta(true); } },
              agoraNao,
            ]),
          ];
        }
      }
      setDialog({ pages, page: 0 });
    },
    [aplicarColeta, entregarColeta, contarHistoria, dismiss]
  );

  // Pisou num item de quest de coleta. Nota: coleta na hora. Página do Zé:
  // só volta para o livro com a resposta certa (errar não perde nada).
  const onColetaRef = useRef(null);
  useEffect(() => {
    onColetaRef.current = ({ quest: id, item: itemId }) => {
      const q = QUESTS_COLETA[id];
      const est = coletasRef.current[id];
      const item = q?.itens.find((i) => i.id === itemId);
      if (!item || est.etapa !== "coletando" || est.itens.includes(itemId)) return;
      const faltam = q.itens.length - est.itens.length - 1;
      const resto =
        faltam > 0
          ? `${faltam > 1 ? "Faltam" : "Falta"} ${faltam} ${faltam > 1 ? q.item.plural : q.item.nome}.`
          : `Agora leve tudo para o ${q.nomeNpc}!`;
      const coletar = () => {
        aplicarColeta(id, { tipo: "coletar", item: itemId });
        engineRef.current?.coletar(id, itemId);
      };
      // Bug de acessibilidade (quest do Rafa): a correção é um modal com o
      // "antes" e o "depois" (CorrigirBug.jsx).
      if (q.tipoItem === "bug") {
        setDialog(null);
        setModal({ tipo: "bug", quest: id, item, resto });
        return;
      }
      const errou = () => {
        tocar("ui-erro");
        setDialog({
          pages: [
            {
              title: "Página do Livro Sábio",
              text: "Hmm, não é bem isso. A página continua aqui: pense mais um pouco e tente de novo.",
              actions: [
                { label: "Tentar de novo", primary: true, onSelect: () => perguntar() },
                { label: "Depois", onSelect: dismiss },
              ],
            },
          ],
          page: 0,
        });
      };
      function perguntar() {
        setDialog({
          pages: [
            {
              title: "Página do Livro Sábio",
              text: item.pergunta,
              actions: item.opcoes.map((op, i) => ({
                label: op,
                onSelect: () => {
                  if (i !== item.certa) return errou();
                  coletar();
                  tocar("coleta");
                  setDialog({ pages: [{ title: "Resposta certa!", text: `${item.explicacao} ${resto}` }], page: 0 });
                },
              })),
            },
          ],
          page: 0,
        });
      }
      perguntar();
    };
  }, [aplicarColeta, dismiss]);

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

  // Bicicletário da praça do Front-End: antes da bicicleta, oferece a
  // oficina (minigame); depois, só lembra como usar.
  const abrirBicicletario = useCallback(() => {
    const title = "Bicicletário da Vila";
    if (lerBicicleta()) {
      // Com a bicicleta: convite para a corrida na Pista (já aquece o mapa).
      engineRef.current?.prepararPista?.();
      const rec = lerCorrida().recorde;
      setDialog({
        pages: [
          {
            title,
            text: `Pronto para correr? A Pista tem 2 voltas: passe pelos arcos em ordem e cruze a chegada no menor tempo. Ouro dá a Stack do Pedal!${rec ? ` Seu recorde: ${formatarTempo(rec)}.` : ""}`,
            actions: [
              {
                label: "Correr no circuito",
                primary: true,
                onSelect: () => {
                  setDialog(null);
                  engineRef.current?.entrarPista?.();
                },
              },
              { label: "Agora não", onSelect: dismiss },
            ],
          },
        ],
        page: 0,
      });
      return;
    }
    setDialog({
      pages: [
        {
          title,
          text: "Uma bicicleta da SEMEC está encostada aqui: pneu murcho, parafuso do guidão solto e corrente seca. Quem consertar pode ficar com ela!",
          actions: [
            {
              label: "Consertar a bicicleta",
              primary: true,
              onSelect: () => {
                setDialog(null);
                setModal({ tipo: "oficina" });
              },
            },
            { label: "Agora não", onSelect: dismiss },
          ],
        },
      ],
      page: 0,
    });
  }, [dismiss]);
  // Bug corrigido no modal: coleta e avisa quantos faltam.
  const bugCorrigido = useCallback(() => {
    if (modal?.tipo !== "bug") return;
    const { quest: id, item, resto } = modal;
    aplicarColeta(id, { tipo: "coletar", item: item.id });
    engineRef.current?.coletar(id, item.id);
    setModal(null);
    setDialog({ pages: [{ title: "Bug corrigido!", text: `${item.onde}: agora está acessível. ${resto}` }], page: 0 });
  }, [modal, aplicarColeta]);

  // Eventos da corrida (vila-engine.js, onCorrida).
  useEffect(() => {
    onCorridaRef.current = (ev) => {
      if (ev.tipo === "entrou") {
        setCorrida({ fase: "contagem", n: 3, volta: 1, voltas: ev.voltas ?? 2, checkpoint: 0, total: ev.total ?? 0 });
      } else if (ev.tipo === "contagem") {
        setCorrida((c) => ({ ...(c ?? {}), fase: "contagem", n: ev.n, volta: 1, checkpoint: 0, voltas: ev.voltas ?? c?.voltas ?? 2, total: ev.total ?? c?.total ?? 0 }));
      } else if (ev.tipo === "largada") {
        setCorrida((c) => ({ ...c, fase: "correndo", inicio: ev.inicio }));
      } else if (ev.tipo === "checkpoint") {
        setCorrida((c) => ({ ...c, checkpoint: ev.i + 1, total: ev.total ?? c.total, volta: ev.volta ?? c.volta }));
      } else if (ev.tipo === "volta") {
        // Fechou uma volta: zera as bolinhas (na última, ficam todas cheias).
        setCorrida((c) => {
          const voltas = ev.voltas ?? c.voltas;
          return ev.volta >= voltas ? { ...c, voltas, checkpoint: c.total } : { ...c, voltas, volta: ev.volta + 1, checkpoint: 0 };
        });
      } else if (ev.tipo === "chegada") {
        setCorrida((c) => ({ ...c, fase: "fim", tempo: ev.tempo }));
        const res = salvarResultado(Math.round(ev.tempo));
        setTimeout(() => {
          if (res.novoRecorde) tocar("recorde");
          if (res.ganhouStack) tocar("stack");
          setModal({ tipo: "corrida", ...res });
        }, 1600);
      } else if (ev.tipo === "saiu") {
        setCorrida(null);
      }
    };
  }, []);
  const correrDeNovo = useCallback(() => {
    setModal(null);
    engineRef.current?.correrDeNovo?.();
  }, []);
  const sairDaPista = useCallback(() => {
    setModal(null);
    engineRef.current?.sairDaPista?.();
  }, []);

  const concluirOficina = useCallback(() => {
    tocar("stack");
    salvarBicicleta(true);
    setModal(null);
  }, []);
  const alternarBike = useCallback(() => {
    engineRef.current?.toggleBicicleta();
  }, []);

  const onInteractRef = useRef(null);
  useEffect(() => {
    onInteractRef.current = (ev) => {
      if (ev.type === "npc") openNpc(ev.index);
      else if (ev.type === "treinador") abrirTreinador(ev.id);
      else if (ev.id === "bicicletario") abrirBicicletario();
      else if (SIGN_TEXT[ev.id]) setDialog({ pages: [SIGN_TEXT[ev.id]], page: 0 });
    };
  }, [openNpc, abrirTreinador, abrirBicicletario]);

  // Pisou na ocarina (o motor já mostra ela subindo): avisa e manda devolver.
  const onQuestFindRef = useRef(null);
  useEffect(() => {
    onQuestFindRef.current = () => {
      avancarQuest("achou");
      tocar("coleta");
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
      if (!started || cena || modal) return;
      // Na galeria, todo mundo só mostra a ficha (sem batalhas)...
      if (ev?.museu) {
        // ...menos quem dá quest ali (o Rafa: caça aos bugs).
        const questGaleria = questDoNpc(ev.id, "galeria");
        if (questGaleria) abrirQuestColeta(questGaleria);
        else if (ehFicha(ev.id)) setFicha(ev.id);
        return;
      }
      // Zé Carlos e Emily dão quest: conversam em vez de abrir a ficha (a
      // ficha fica no botão "Ver ficha" do diálogo).
      const questId = questDoNpc(ev?.id);
      if (questId) {
        abrirQuestColeta(questId);
        return;
      }
      if (!ehFicha(ev?.id)) return;
      setFicha(ev.id);
    };
  }, [started, cena, modal, abrirQuestColeta]);

  useEffect(() => {
    let engine = null;
    let cancelled = false;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    import("./vila-engine")
      .then(({ createVila }) => {
        if (cancelled || !hostRef.current) return;
        const { nivel, auto, gpu } = resolverNivel(graficos);
        // Sem WebGL2 (vídeo muito antigo ou driver sem suporte) o three.js não
        // roda: fica a equipe em lista, com o aviso.
        if (!gpu.webgl2) {
          setStatus("sem-webgl");
          return;
        }
        setSemAceleracao(gpu.software);
        setNivelAtual(nivel);
        // Motor novo (recarga a quente, troca de membros) nasce na Vila: a
        // interface não pode ficar presa num andar, íris ou painel do motor antigo.
        setLocal("vila");
        setTransicao(null);
        setCargaPista(null);
        setQuadroAberto(null);
        setElevadorAberto(false);
        setVoltouDoPredio(false);
        engine = createVila(hostRef.current, {
          members,
          leaders: new Set(mapaDeLideres(members).keys()),
          reducedMotion,
          quality: nivel,
          autoQuality: auto,
          onQualityDrop: (novo) => {
            setNivelAtual(novo);
            // Só guarda as quedas que mudam a cena (modelos e mato leves).
            if (auto && ehLeve(novo)) lembrarNivelAuto(novo);
          },
          modelUrl: `${basePath}/quem-somos/gava.glb`,
          playerModel: arquivoDoJogador((personagemRef.current ??= lerJogadorSalvo() ?? "homem")),
          onBicicleta: (on) => {
            setNaBike(on);
            tocar(on ? "campainha" : "bike-desce");
          },
          onSom: (nome, opts) => tocar(nome, opts),
          onCorrida: (ev) => onCorridaRef.current?.(ev),
          bicicletaLiberada: lerBicicleta(),
          onPreparo: setPreparo,
          carregando: true,
          onInteract: (ev) => onInteractRef.current?.(ev),
          onInspect: (ev) => onInspectRef.current?.(ev),
          onFacing: setFacing,
          onReady: () => setStatus("ready"),
          onClock: setClock,
          onCutsceneSay: (fala) => setDialog({ pages: [fala], page: 0, cena: true }),
          onQuestNear: setQuestPerto,
          onQuestFind: () => onQuestFindRef.current?.(),
          onColeta: (ev) => onColetaRef.current?.(ev),
          onColetaPerto: ({ quest, perto }) => setColetaPerto((p) => (p[quest] === perto ? p : { ...p, [quest]: perto })),
          quadrosMuseu,
          onLocal: ({ local: l }) => {
            setLocal(l);
            setVoltouDoPredio(l === "vila");
          },
          onElevador: () => setElevadorAberto(true),
          // Objeto que ensina: o texto abre na caixa de diálogo (texto pode
          // ser uma lista de páginas).
          onInfo: (info) => {
            const textos = Array.isArray(info.texto) ? info.texto : [info.texto];
            setDialog({ pages: textos.map((text) => ({ title: info.titulo, text })), page: 0 });
          },
          onTransicao: (ev) => setTransicao(ev),
          onCarregamentoPista: ({ ativo, progresso, etapa }) => setCargaPista(ativo ? { progresso, etapa } : null),
          onQuadro: ({ id }) => {
            const h = hostRef.current;
            setQuadroAberto({ id, estreito: Boolean(h && h.clientWidth < h.clientHeight) });
          },
          onCutsceneEfeito: (cmd) => {
            if (cmd.efeito === "sepia") setSepia(Boolean(cmd.on));
            else if (cmd.efeito === "relogio") setRelogioCena(cmd.on ? { sentido: cmd.sentido } : null);
            else if (cmd.efeito === "pagina") setPaginaHistoria(cmd.pagina);
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
  }, [members, graficos, quadrosMuseu]);

  useEffect(() => {
    engineRef.current?.setPaused(
      !started || Boolean(dialog) || Boolean(modal) || Boolean(ficha) || campanhaAberta || dexAberta || elevadorAberto
    );
    engineRef.current?.setAttract(!started);
  }, [started, dialog, modal, ficha, campanhaAberta, dexAberta, elevadorAberto, status]);

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
  // Quests de coleta no mapa: cristal sobre quem dá e itens que faltam.
  useEffect(() => {
    for (const id of IDS_COLETA) engineRef.current?.setColeta(id, coletas[id]);
  }, [coletas, status]);
  // "Quest concluída" (coleta) fica alguns segundos no canto e some.
  useEffect(() => {
    if (!coletaFeita) return undefined;
    const t = setTimeout(() => setColetaFeita(null), QUEST_FEITA_MS);
    return () => clearTimeout(t);
  }, [coletaFeita]);

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
      const seguinte = CHEFES.find((c) => c.requer === chefeId && !c.bonus);
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

  // escolhido: { id } da tela de escolha; sem ele (Enter direto na tela de
  // título), vale o último personagem.
  // Tela de carregamento inicial (ver pulouCarga): some quando o motor avisa
  // "pronto", se o 3D não roda neste navegador, ou se a pessoa pulou.
  const semJogo3d = status === "error" || status === "sem-webgl";
  const carregandoTudo = !started && !semJogo3d && preparo.fase !== "pronto" && !pulouCarga;
  useEffect(() => {
    engineRef.current?.setCarregando(carregandoTudo);
  }, [carregandoTudo]);

  // O jogo só abre com a Vila preparada (motor: cargas, shaders e texturas
  // perto do jogador, feito durante a tela de título). Se ainda não acabou,
  // a tela "Preparando a Vila" mostra o progresso; PREPARO_MAX_MS é o teto
  // (PC muito lento ou carga presa: abre assim mesmo).
  const startGame = useCallback((escolhido) => {
    if (comecandoRef.current) return;
    const id = escolhido?.id ?? personagemRef.current ?? lerJogadorSalvo() ?? "homem";
    const engine = engineRef.current;
    let timerPular = 0;
    if (id !== personagemRef.current) {
      personagemRef.current = id;
      engine?.setJogador(arquivoDoJogador(id));
    }
    salvarJogador(id);
    const comecar = () => {
      if (!comecandoRef.current && engine) return; // já começou (pulou ou terminou)
      comecandoRef.current = false;
      clearTimeout(timerPular);
      setAguardandoPreparo(false);
      setPodePularPreparo(false);
      setStarted(true);
      setDialog({ pages: INTRO, page: 0 });
      stageRef.current?.focus({ preventScroll: true });
    };
    if (!engine) {
      comecar();
      return;
    }
    comecandoRef.current = true;
    comecarRef.current = comecar;
    setAguardandoPreparo(true);
    timerPular = setTimeout(() => setPodePularPreparo(true), PREPARO_PULAR_MS);
    Promise.race([engine.preparar(), new Promise((r) => setTimeout(r, PREPARO_MAX_MS))]).then(comecar);
  }, []);

  // Enter na tela de título começa o jogo (como "Press Start"), exceto quando
  // o foco está num campo, link ou botão — esses tratam a própria tecla.
  useEffect(() => {
    if (started || carregandoTudo) return undefined;
    const onKey = (e) => {
      if (e.key !== "Enter" || e.repeat) return;
      if (e.target.closest?.("input, textarea, select, button, a, [contenteditable='true']")) return;
      e.preventDefault();
      startGame();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, carregandoTudo, startGame]);

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
  // Quem fala: índice em members ou, para quem não é da lista (Zé Carlos,
  // Emily), { name, retrato } direto (public/quem-somos/retratos/).
  const falante = !current
    ? null
    : Number.isInteger(current.falante)
      ? members[current.falante]
      : current.falante?.retrato
        ? current.falante
        : null;

  // Blip de fala a cada letra nova (voz por personagem; placas e avisos têm
  // a voz "placa"). sfx.js limita a frequência.
  const vozDaFala = falante?.retrato ?? "placa";
  useEffect(() => {
    if (digitacao.pronto) return;
    if (/[\p{L}\p{N}]/u.test(digitacao.visivel.slice(-1))) tocar("fala", { quem: vozDaFala });
  }, [digitacao.visivel, digitacao.pronto, vozDaFala]);

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
    tocar("ui-mover");
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
    } else if (e.code === "KeyB" && temBicicleta) {
      e.preventDefault();
      if (!e.repeat) engine.toggleBicicleta();
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
    tocar("ui-ok");
    // Ações montadas no render (sem onSelect): "Ver ficha" e o "Fechar" dela.
    if (action.ficha) setFicha(action.ficha);
    else if (action.fechar) dismiss();
    else action.onSelect();
  };

  let hint = "";
  if (cena || ficha || quadroAberto || transicao || elevadorAberto) {
    hint = "";
  } else if (!dialog && !modal && facing?.type === "porta") {
    hint = "Espaço: entrar na SEMFAZ";
  } else if (!dialog && !modal && facing?.type === "info") {
    hint = `Espaço: ler sobre ${facing.titulo}`;
  } else if (!dialog && !modal && facing?.type === "saida") {
    hint = facing.saida === "elevador" ? "Espaço: chamar o elevador" : "Espaço: sair para a Vila";
  } else if (!dialog && !modal && facing?.type === "quadro") {
    const q = quadrosMuseu.find((x) => x.id === facing.id);
    const p = q ? null : PESSOAS_SEMFAZ.find((x) => x.id === facing.id);
    if (q) hint = `Espaço: ver o quadro de ${q.nome}`;
    else if (p) hint = `Espaço: conhecer ${p.nome} (${p.setor})`;
  } else if (!dialog && !modal && facing?.type === "museu-pessoa" && ehFicha(facing.id)) {
    const qg = questDoNpc(facing.id, "galeria");
    hint = `Espaço: falar com ${FICHAS[facing.id].nome}${qg ? ` (quest: ${QUESTS_COLETA[qg].titulo})` : ""}`;
  } else if (!dialog && !modal && facing?.type === "npc" && members[facing.index]) {
    const chefeId = lideres.get(facing.index);
    const papel = chefeId
      ? `, ${minusculaInicial(CHEFE_POR_ID[chefeId].titulo)}`
      : members[facing.index].quest
        ? ` (quest: ${QUEST.titulo})`
        : "";
    hint = `Espaço: falar com ${members[facing.index].name}${papel}`;
  } else if (!dialog && !modal && facing?.type === "treinador") {
    const t = TREINADORES.find((x) => x.id === facing.id);
    if (t) hint = `Espaço: falar com ${t.titulo}`;
  } else if (!dialog && !modal && facing?.type === "sign") {
    hint = facing.id === "bicicletario" ? "Espaço: ver o bicicletário" : "Espaço: ler a placa";
  } else if (!dialog && !modal && facing?.type === "inspect" && questDoNpc(facing.id)) {
    const q = QUESTS_COLETA[questDoNpc(facing.id)];
    hint = `Espaço: falar com ${q.nomeNpc} (quest: ${q.titulo})`;
  } else if (!dialog && !modal && facing?.type === "inspect" && ehFicha(facing.id)) {
    hint = `Espaço: ver a ficha de ${FICHAS[facing.id].nome}`;
  }

  const total = members.length;
  const jogador = progresso?.jogador;
  // Painel da quest: ao chegar perto do Pedro, durante a busca e logo depois
  // da entrega.
  const questConcluida = questEtapa === "concluida";
  const naVila = local === "vila";
  // Trilha: título → Vila / prédio → batalha; nada durante o carregamento.
  const faixa = carregandoTudo ? null : !started ? "titulo" : modal?.tipo === "batalha" ? "batalha" : local === "pista" ? "corrida" : naVila ? "vila" : "predio";
  useEffect(() => {
    faixaRef.current = faixa;
    tocarMusica(somPref === "tudo" ? faixa : null);
  }, [faixa, somPref]);
  const mostrarQuest = started && !cena && naVila && (questFeita || (!questConcluida && (questPerto || questEtapa !== "nova")));
  // Stacks no HUD (insígnias de insignias.js): ginásios, ocarina e as das
  // quests do Zé e da Emily; cinza enquanto não conquistadas.
  const stacksHud = [
    ...CHEFES.map((c) => ({ id: c.stack.id, nome: c.stack.nome, ok: vencidos.includes(c.id) })),
    { id: QUEST.recompensa.id, nome: QUEST.recompensa.nome, ok: questConcluida },
    ...IDS_COLETA.map((id) => {
      const r = QUESTS_COLETA[id].recompensa;
      return { id: r.id, nome: r.nome, ok: coletas[id].etapa === "concluida" };
    }),
    { id: "pedal", nome: "Stack do Pedal", ok: placarCorrida.medalhas.ouro > 0 },
  ];
  // Quests de coleta: mesma regra, por quest.
  const mostrarColeta = (id) =>
    started &&
    !cena &&
    // A caça aos bugs também tem itens nos andares: o painel vale no prédio.
    (naVila || Boolean(QUESTS_COLETA[id].local)) &&
    (coletaFeita === id || (coletas[id].etapa !== "concluida" && (coletaPerto[id] || coletas[id].etapa !== "nova")));

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
        Use as setas ou W A S D para andar, Shift para correr, B para subir ou descer da bicicleta (depois de consertá-la no bicicletário), Espaço ou Enter
        para conversar, mais e menos (ou a roda do mouse) para aproximar e
        afastar a câmera e Esc para fechar o diálogo. A mesma equipe está
        listada logo abaixo do mapa.
      </p>

      {carregandoTudo && (
        <TelaCarregamento
          baseUrl={`${basePath}/quem-somos/`}
          progresso={preparo.progresso}
          fase={preparo.fase}
          podePular={podePularCarga}
          onPular={() => setPulouCarga(true)}
        />
      )}

      {!started && !carregandoTudo && (
        <TitleScreen
          onStart={startGame}
          baseUrl={`${basePath}/quem-somos/`}
          graficos={graficos}
          nivelAtual={nivelAtual}
          semAceleracao={semAceleracao}
          onGraficos={salvarPreferencia}
        />
      )}

      {!started && aguardandoPreparo && (
        <div className="vila-preparo">
          <div className="vila-preparo-caixa">
            <p className="vila-preparo-titulo">Preparando a Vila…</p>
            <progress
              className="vila-preparo-barra"
              max={100}
              value={Math.round(preparo.progresso * 100)}
              aria-label="Progresso do carregamento"
            />
            <p className="vila-preparo-fase" role="status">{ROTULO_PREPARO[preparo.fase] ?? "Quase lá…"}</p>
            {podePularPreparo && (
              <button type="button" className="vila-preparo-pular" onClick={() => comecarRef.current?.()}>
                Jogar agora <span className="vila-preparo-pular-nota">(pode travar um pouco no começo)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {started && !cena && !quadroAberto && (
        <div className="vila-hud vila-hud--top">
          <div className="vila-panel vila-title" data-oculto={local === "pista" || undefined}>
            <h1 id="vila-titulo">{naVila ? "Quem Somos" : local === "pista" ? "Pista de Corrida" : naGaleria ? "Galeria da Equipe" : andarAtual?.nome}</h1>
            <p className="vila-counter">
              {naVila ? (
                <>
                  Conversas: <strong>{talked.size}</strong>/{total}
                </>
              ) : (
                <>
                  {andarAtual?.rotulo} · {naGaleria ? "Quadros" : "Pessoas"}: <strong>{itensDoAndar.length}</strong>
                </>
              )}
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
          </div>
          <div className="vila-hud-direita">
            <div className="vila-hud-actions">
              <a className="vila-panel vila-skip" href="#equipe">
                Voltar para a equipe
              </a>
              <SomButton />
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
            {IDS_COLETA.filter((id) => mostrarColeta(id)).map((id) => {
              const q = QUESTS_COLETA[id];
              const est = coletas[id];
              const feita = est.etapa === "concluida";
              return (
                <section key={id} className="vila-panel vila-quest" data-etapa={est.etapa} aria-labelledby={`vila-quest-titulo-${id}`}>
                  <p className="vila-quest-tag">{feita ? "Quest concluída" : est.etapa === "nova" ? "Nova quest" : "Quest em andamento"}</p>
                  <h2 id={`vila-quest-titulo-${id}`} className="vila-quest-titulo">
                    <span className="vila-quest-icone" aria-hidden="true">
                      ◆
                    </span>
                    {q.titulo}
                  </h2>
                  <p className="vila-quest-objetivo" aria-live="polite">
                    {objetivoColeta(q, est)}
                  </p>
                  <p className="vila-quest-recompensa">
                    Recompensa: <strong>{q.recompensa.nome}</strong>
                  </p>
                </section>
              );
            })}
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
      {status === "sem-webgl" && (
        <p className="vila-status" role="alert">
          A placa de vídeo deste computador não roda o mapa 3D. A equipe está
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

      {status === "ready" && started && !focused && !dialog && !modal && !ficha && !cena && !quadroAberto && (
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

      {/* Entrada e saída do prédio: íris que fecha no escuro, com o nome do
          lugar, e abre do outro lado. De elevador, a viagem é toda no 3D
          (vila-engine.js, ELEVADOR_IDA/_VOLTA): aqui só o escurecer rápido da
          troca de andar, uma cor sólida, sem desenho. */}
      {transicao && transicao.modo !== "elevador" && (
        <div className="vila-iris" data-fase={transicao.fase} aria-hidden="true">
          <p className="vila-iris-titulo">{transicao.rotulo}</p>
        </div>
      )}
      {transicao?.modo === "elevador" && <div className="vila-elevador" data-fase={transicao.fase} aria-hidden="true" />}
      {/* Ida à Pista ainda fria: carregamento da corrida por cima da íris
          fechada (vila-engine.js, onCarregamentoPista). */}
      {cargaPista && <TelaCarregamentoPista progresso={cargaPista.progresso} etapa={cargaPista.etapa} />}
      <p className="sr-only" aria-live="polite">
        {!started
          ? ""
          : naVila
            ? voltouDoPredio
              ? "Você voltou para a Vila SEMEC, na frente da SEMFAZ."
              : ""
            : local === "pista"
              ? "Você está na Pista de Corrida. Passe pelos arcos em ordem e cruze a chegada duas vezes. O portão do box leva de volta à Vila."
              : naGaleria
              ? "Você está na Galeria da Equipe. Quadros nas paredes: aproxime-se e aperte Espaço para ver. O elevador fica ao sul."
              : `Você está no ${andarAtual?.rotulo}, ${andarAtual?.nome}. Aproxime-se de uma mesa e aperte Espaço para conhecer quem chefia cada setor. O elevador fica ao norte.`}
      </p>
      {elevadorAberto && (
        <PainelElevador
          atual={local}
          onEscolher={(id) => {
            setElevadorAberto(false);
            engineRef.current?.irParaAndar(id);
            requestAnimationFrame(() => focusStage());
          }}
          onFechar={() => {
            setElevadorAberto(false);
            requestAnimationFrame(() => focusStage());
          }}
        />
      )}
      {quadroAberto && (
        <QuadroMuseu
          quadros={itensDoAndar}
          tipo={naGaleria ? "quadro" : "mesa"}
          fonte={naGaleria ? null : FONTE_SEMFAZ}
          id={quadroAberto.id}
          estreito={quadroAberto.estreito}
          onTrocar={(id) => {
            engineRef.current?.focarQuadro(id);
            setQuadroAberto((q) => ({ ...q, id }));
          }}
          onFechar={() => {
            engineRef.current?.fecharQuadro();
            setQuadroAberto(null);
            requestAnimationFrame(() => focusStage());
          }}
        />
      )}

      {campanhaAberta && <Campanha onFim={fimCampanha} onSair={sairCampanha} />}
      {dexAberta && (
        <StackDex
          itens={stacksHud.map((st) => ({ id: st.id, ok: st.ok }))}
          onFechar={() => {
            setDexAberta(false);
            // Devolve o foco ao botão que abriu (depois que o overlay sai).
            requestAnimationFrame(() => dexOrigemRef.current?.focus());
          }}
        />
      )}

      {/* Roda de história do Zé: a ilustração grande fica atrás do diálogo. */}
      {cena && <LivroHistoria pagina={paginaHistoria} />}

      {current && (
        <div
          className={`vila-dialog${falante ? " vila-dialog--retrato" : ""}`}
          role="region"
          aria-label="Diálogo"
          aria-live="polite"
        >
          {falante && (
            <Retrato
              key={falante.retrato ?? current.falante}
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

      {/* Atalho da StackDex no canto inferior esquerdo: um "aparelho" redondo. */}
      {started && !cena && !dialog && !modal && !ficha && !quadroAberto && (
        <button type="button" className="vila-dex-icone" aria-haspopup="dialog" onClick={abrirDex}>
          <span className="vila-dex-icone-aparelho" aria-hidden="true">
            <span className="vila-dex-icone-lente" />
            <span className="vila-dex-icone-leds">
              <span />
              <span />
              <span />
            </span>
          </span>
          <span className="vila-dex-icone-nome">StackDex</span>
          <span className="vila-dex-icone-contagem">
            {stacksHud.filter((st) => st.ok).length}
            <span aria-hidden="true">/</span>
            <span className="sr-only"> de </span>
            {stacksHud.length}
            <span className="sr-only"> insígnias</span>
          </span>
        </button>
      )}

      {/* Bicicleta conquistada na oficina: acima da StackDex, liga e desliga. */}
      {started && temBicicleta && !cena && !dialog && !modal && !ficha && !quadroAberto && (
        <button
          type="button"
          className="vila-bike-icone"
          aria-pressed={naBike}
          aria-keyshortcuts="B"
          onClick={() => {
            alternarBike();
            focusStage();
          }}
        >
          <span className="vila-bike-icone-roda" aria-hidden="true">
            <Bike size={30} strokeWidth={2.4} />
          </span>
          <span className="vila-bike-icone-nome">Bicicleta</span>
        </button>
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
          {temBicicleta && (
            <button
              type="button"
              className="vila-pad-btn vila-pad-btn--b"
              aria-pressed={naBike}
              aria-label="Bicicleta"
              onClick={alternarBike}
            >
              B
            </button>
          )}
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

      {corrida && local === "pista" && !cena && (
        <CorridaHud
          fase={corrida.fase}
          n={corrida.n}
          inicio={corrida.inicio}
          tempo={corrida.tempo}
          volta={corrida.volta}
          voltas={corrida.voltas}
          checkpoint={corrida.checkpoint}
          totalCheckpoints={corrida.total}
          recorde={placarCorrida.recorde}
          reducedMotion={movimentoReduzido}
        />
      )}
      {modal?.tipo === "corrida" && (
        <ModalJornada titulo="Resultado da corrida" onFechar={correrDeNovo}>
          <ResultadoCorrida
            tempo={modal.tempo}
            recorde={modal.recorde}
            novoRecorde={modal.novoRecorde}
            medalha={modal.medalha}
            ganhouStack={modal.ganhouStack}
            onDeNovo={correrDeNovo}
            onSair={sairDaPista}
          />
        </ModalJornada>
      )}
      {modal?.tipo === "bug" && (
        <ModalJornada titulo={`Bug: ${modal.item.onde}`} onFechar={fecharModal}>
          <CorrigirBug key={modal.item.id} item={modal.item} onCorrigido={bugCorrigido} />
        </ModalJornada>
      )}
      {modal?.tipo === "oficina" && (
        <ModalJornada titulo="Oficina da bicicleta" onFechar={fecharModal}>
          <OficinaBike onConcluir={concluirOficina} />
        </ModalJornada>
      )}
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
            // Cena de vitória só nos ginásios (treinador não dá Stack).
            if (retorno.venceu && primeira && modal.chefeId !== "diretoria" && CHEFE_POR_ID[modal.chefeId]) cenaPendente.current = modal.chefeId;
            return retorno;
          }}
          onFechar={fecharModal}
        />
      )}
    </section>
  );
}
