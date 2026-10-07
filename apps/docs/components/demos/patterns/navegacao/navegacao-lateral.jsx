"use client";

import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarToggleButton,
  useSidebar,
} from "semec-ds/react";
import { CreditCard, FileText, LayoutDashboard, Settings, Users } from "lucide-react";

const GRUPOS = [
  {
    label: "Operação do dia",
    itens: [
      { id: "painel", label: "Painel", Icon: LayoutDashboard },
      { id: "requerimentos", label: "Requerimentos", Icon: FileText },
      { id: "pagamentos", label: "Pagamentos", Icon: CreditCard },
    ],
  },
  {
    label: "Administração",
    itens: [
      { id: "usuarios", label: "Usuários", Icon: Users },
      { id: "configuracoes", label: "Configurações", Icon: Settings },
    ],
  },
];

const TODOS_ITENS = GRUPOS.flatMap((grupo) => grupo.itens);

/**
 * Coluna lateral + conteúdo principal, dentro do SidebarProvider.
 *
 * `menuAberto` espelha o estado efetivo: em telas largas é o `open`
 * controlado; em telas estreitas o kit abre um painel fixo (drawer) e o
 * estado útil é `openMobile`. Assim o rótulo e o aria-expanded do gatilho
 * sempre descrevem o que está na tela.
 */
function AreaDeTrabalho({ aberto, aoAlternar, ativo, aoSelecionar }) {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const menuAberto = isMobile ? openMobile : aberto;
  const nomeAtivo = TODOS_ITENS.find((item) => item.id === ativo)?.label ?? "";

  function alternarMenu() {
    aoAlternar();
    setOpenMobile((estado) => !estado);
  }

  return (
    <>
      <Sidebar inert={!menuAberto}>
        <SidebarContent>
          {GRUPOS.map((grupo) => (
            <SidebarGroup key={grupo.label}>
              <SidebarGroupLabel>{grupo.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {grupo.itens.map(({ id, label, Icon }) => (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuButton asChild isActive={id === ativo}>
                        <a
                          href="#proto"
                          aria-current={id === ativo ? "page" : undefined}
                          onClick={(event) => {
                            event.preventDefault();
                            aoSelecionar(id);
                          }}
                        >
                          <Icon aria-hidden="true" />
                          <span>{label}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Requerimentos</p>
            <p className="text-xs text-muted-foreground">Seção atual: {nomeAtivo}</p>
          </div>
          <div className="flex items-center gap-2">
            <SidebarToggleButton open={menuAberto} onToggle={alternarMenu} />
            <span className="text-xs text-muted-foreground" role="status">
              {menuAberto ? "Menu aberto" : "Menu recolhido"}
            </span>
          </div>
        </div>
        <div className="flex-1 p-4">
          <p className="text-sm text-muted-foreground">
            O conteúdo ocupa o espaço que sobra quando a barra é recolhida. O gatilho expõe o
            estado com aria-expanded e muda o rótulo entre &quot;Abrir menu&quot; e
            &quot;Fechar menu&quot;.
          </p>
        </div>
      </div>
    </>
  );
}

/**
 * Navegação lateral em coluna: grupos com rótulo, item ativo marcado com
 * isActive + aria-current e gatilho para recolher a barra (estado em useState).
 * A caixa tem altura fixa para o preview caber no iframe.
 */
export function NavegacaoLateralDemo() {
  const [aberto, setAberto] = useState(true);
  const [ativo, setAtivo] = useState("requerimentos");

  return (
    <div className="w-full overflow-hidden text-left">
      <SidebarProvider open={aberto} onOpenChange={setAberto} className="h-[264px] min-h-0">
        <AreaDeTrabalho
          aberto={aberto}
          aoAlternar={() => setAberto((estado) => !estado)}
          ativo={ativo}
          aoSelecionar={setAtivo}
        />
      </SidebarProvider>
    </div>
  );
}
