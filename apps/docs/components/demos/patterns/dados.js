/**
 * Registro dos exemplos visuais dos padrões de dados e relatórios.
 * Chave = rota (`/padroes/dados-relatorios/<slug>`). Dados puros: sem "use client".
 */

// Snippet compartilhado com a página /padroes/dados-relatorios/tabelas.
import { tableAdvancedUsage } from "../examples/table-advanced-data";

export const dadosPatterns = {
  "dados/filtros": {
    label: "Painel de filtros",
    desc: "Critérios combinados com chips removíveis, contador de resultados e limpar tudo.",
    filename: "FiltrosDemo.jsx",
    prompt:
      "Crie um painel de filtros usando @semec/ds/react (Select, Checkbox, Badge, Button): chips removíveis, contador de resultados em aria-live e ação de limpar filtros.",
    usage: `import { Badge, Button, Checkbox, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@semec/ds/react";
import { X } from "lucide-react";

<Select value={status} onValueChange={setStatus}>
  <SelectTrigger aria-label="Filtrar por status"><SelectValue /></SelectTrigger>
  <SelectContent><SelectItem value="todos">Todos os status</SelectItem>
    <SelectItem value="deferido">Deferido</SelectItem></SelectContent>
</Select>
<Checkbox id="fl-urgente" checked={urgente} onCheckedChange={setUrgente} />
<Label htmlFor="fl-urgente">Somente urgentes</Label>

<Badge variant="secondary">Status: Deferido <X aria-hidden="true" /></Badge>
<p role="status" aria-live="polite">{filtrados.length} de {total} resultados</p>
<Button variant="outline" onClick={limparFiltros}>Limpar filtros</Button>`,
  },
  "dados/pesquisa": {
    label: "Campo de pesquisa",
    desc: "Busca dentro da tabela com destaque do termo e total de correspondências.",
    filename: "PesquisaDemo.jsx",
    prompt:
      "Crie uma pesquisa em tabela usando @semec/ds/react (Input, Table): filtro ao digitar, marcação do termo encontrado e total anunciado em aria-live.",
    usage: `import { Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@semec/ds/react";

<label htmlFor="ps-busca">Buscar protocolo</label>
<Input id="ps-busca" value={termo} onChange={(e) => setTermo(e.target.value)} />

<p role="status" aria-live="polite">{resultados.length} de {total} protocolos encontrados</p>
<Table>
  <TableHeader><TableRow>
    <TableHead>Protocolo</TableHead><TableHead>Requerente</TableHead>
  </TableRow></TableHeader>
  <TableBody>{resultados.map((r) => (
    <TableRow key={r.protocolo}><TableCell><mark>{destaque(r.protocolo, busca)}</mark></TableCell></TableRow>
  ))}</TableBody>
</Table>`,
  },
  "dados/ordenacao": {
    label: "Colunas ordenáveis",
    desc: "Ordenação por coluna com indicador visual, direção alternada e aria-sort.",
    filename: "OrdenacaoDemo.jsx",
    prompt:
      "Crie colunas ordenáveis usando @semec/ds/react (DataTable): aria-sort na coluna ativa, alternância de direção e anúncio do estado para leitor de tela.",
    usage: `import { DataTable } from "@semec/ds/react";

const colunas = [
  { key: "protocolo", header: "Protocolo", sortable: true },
  { key: "requerente", header: "Requerente", sortable: true },
  { key: "valor", header: "Valor", sortable: true },
];

<DataTable columns={colunas} data={ordenados} sortKey={sortKey} sortDir={sortDir} onSort={aoOrdenar} />
<p role="status" aria-live="polite">Ordenado por {coluna}, {direcao} — {ordenados.length} registros</p>`,
  },
  "dados/selecao-de-registros": {
    label: "Seleção de registros",
    desc: "Marcação por linha, marcar todos e contador do que está selecionado.",
    filename: "SelecaoRegistrosDemo.jsx",
    prompt:
      "Crie seleção de registros usando @semec/ds/react (Checkbox, Table): marcar todos com estado indeterminado e contador acessível em aria-live.",
    usage: `import { Checkbox, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@semec/ds/react";

<TableHead className="w-12">
  <Checkbox
    aria-label={todos ? "Desmarcar todos" : "Marcar todos"}
    checked={todos ? true : alguns ? "indeterminate" : false}
    onCheckedChange={alternarTodos}
  />
</TableHead>
<TableCell>
  <Checkbox aria-label={"Selecionar " + r.id} checked={selecionados.has(r.id)} onCheckedChange={() => alternarUm(r.id)} />
</TableCell>
<p role="status" aria-live="polite">{selecionados.size} de {total} registros selecionados</p>`,
  },
  "dados/operacoes-em-lote": {
    label: "Barra de ações em lote",
    desc: "Ações aplicadas à seleção, com confirmação antes de excluir em massa.",
    filename: "OperacoesEmLoteDemo.jsx",
    prompt:
      "Crie uma barra de ações em lote usando @semec/ds/react: aparece só com seleção, anuncia o total e confirma ação destrutiva com AlertDialog.",
    usage: `import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Button } from "@semec/ds/react";
{total > 0 && (
  <div className="flex items-center gap-2 rounded-lg border border-border bg-primary/10 p-3">
    <span className="font-semibold">{total} selecionados</span>
    <Button size="sm" variant="outline" onClick={exportar}>Exportar</Button>
    <Button size="sm" variant="outline" onClick={arquivar}>Arquivar</Button>
    <AlertDialog>
      <AlertDialogTrigger asChild><Button size="sm" variant="destructive">Excluir</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Excluir {total} registros?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={excluir}>Excluir {total}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
)}`,
  },
  "dados/paginacao": {
    label: "Paginação de resultados",
    desc: "Intervalo exibido, total de registros e navegação entre as páginas.",
    filename: "PaginacaoResultadosDemo.jsx",
    prompt:
      "Crie paginação de resultados usando @semec/ds/react (Pagination): mostra 'x–y de z', recorta os dados e anuncia o trecho em aria-live.",
    usage: `import { Pagination } from "@semec/ds/react";

const inicio = (pagina - 1) * POR_PAGINA;
const fatia = registros.slice(inicio, inicio + POR_PAGINA);

<p role="status" aria-live="polite">
  Exibindo {inicio + 1}–{fim} de {registros.length} registros
</p>
<ul className="rounded-lg border border-border">
  {fatia.map((r) => <li key={r.id}>{r.requerente}</li>)}
</ul>
<Pagination page={pagina} pageCount={pageCount} onPageChange={setPagina} />`,
  },
  "dados/estados-sem-resultados": {
    label: "Estado vazio",
    desc: "Sem resultados: motivo, sugestões de ajuste e ação para limpar filtros.",
    filename: "EstadoVazioDemo.jsx",
    prompt:
      "Crie o estado vazio de busca usando @semec/ds/react (EmptyState): título com o motivo, descrição com sugestões e ação para limpar filtros.",
    usage: `import { Button, EmptyState, Label, Switch } from "@semec/ds/react";
import { Inbox } from "lucide-react";
<Switch id="ev-vazio" checked={semResultados} onCheckedChange={setSemResultados} />
<Label htmlFor="ev-vazio">Simular busca sem resultados</Label>
{semResultados ? (
  <EmptyState
    icon={<Inbox />}
    title={'Nenhum resultado para "reforma"'}
    description="Confira a ortografia, remova filtros ou tente outro termo."
    action={<Button variant="outline" onClick={limparBusca}>Limpar busca</Button>}
  />
) : (
  <ul>{resultados.map((r) => <li key={r.id}>{r.requerente}</li>)}</ul>
)}`,
  },
  "dados/indicadores": {
    label: "Cartões de indicadores",
    desc: "Números-chave com variação, período e a explicação do cálculo.",
    filename: "IndicadoresDemo.jsx",
    prompt:
      "Crie cartões de indicadores usando @semec/ds/react (Card, Badge): valor grande, variação em Badge com ícone e texto, período e descrição do cálculo.",
    usage: `import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@semec/ds/react";
import { ArrowUp } from "lucide-react";
<Card>
  <CardHeader className="p-4 pb-2">
    <CardTitle className="text-sm font-medium">{kpi.rotulo}</CardTitle>
    <CardDescription>{kpi.periodo}</CardDescription>
  </CardHeader>
  <CardContent className="space-y-2 p-4 pt-0">
    <span className="text-3xl font-bold tabular-nums">{kpi.valor}</span>
    <Badge variant="success" className="gap-1"><ArrowUp aria-hidden="true" /> {kpi.variacao}</Badge>
    <p className="text-xs font-medium">Melhora frente ao período anterior</p>
    <p className="text-xs text-muted-foreground">Cálculo: {kpi.calc}</p>
  </CardContent>
</Card>`,
  },
  "dados/exportacao": {
    label: "Menu de exportação",
    desc: "Exportação em CSV, XLSX e PDF com estado de geração e download pronto.",
    filename: "ExportacaoDemo.jsx",
    prompt:
      "Crie um menu de exportação usando @semec/ds/react (DropdownMenu, Button): formatos como itens de menu, estado gerando e confirmação quando o arquivo estiver pronto.",
    usage: `import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@semec/ds/react";
import { Download } from "lucide-react";
<DropdownMenu>
  <DropdownMenuTrigger asChild><Button><Download aria-hidden="true" /> Exportar dados</Button></DropdownMenuTrigger>
  <DropdownMenuContent portalContainer={portalContainer}>
    <DropdownMenuLabel>Formato do arquivo</DropdownMenuLabel>
    <DropdownMenuItem disabled={gerando} onSelect={() => gerar("csv")}>CSV</DropdownMenuItem>
    <DropdownMenuItem disabled={gerando} onSelect={() => gerar("xlsx")}>XLSX</DropdownMenuItem>
    <DropdownMenuItem disabled={gerando} onSelect={() => gerar("pdf")}>PDF</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
<p role="status" aria-live="polite">{gerando ? "Gerando arquivo…" : "Arquivo relatorio-protocolos.csv pronto para baixar."}</p>`,
  },
  "dados/graficos": {
    label: "Gráficos",
    desc: "Barras por mês com tabela equivalente — a informação não depende da cor.",
    filename: "GraficosDemo.jsx",
    prompt:
      "Crie um gráfico de barras acessível usando @semec/ds/react: rótulos além da cor, texto alternativo com o resumo dos dados e tabela equivalente alternável.",
    usage: `import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@semec/ds/react";
const ALTURA = { baixo: "h-[55px]", medio: "h-[105px]", alto: "h-[145px]", maximo: "h-[180px]" };
<div role="img" aria-label={resumo}>
  <ul className="flex h-[220px] items-end gap-2">
    {meses.map((m) => (
      <li className="flex flex-1 flex-col items-center justify-end gap-1">
        <span className="text-xs tabular-nums">{m.valor}</span>
        <div className={"w-full rounded-t-sm bg-primary/80 " + ALTURA[m.faixa]} />
      </li>
    ))}
  </ul>
</div>
<Button aria-expanded={mostrarTabela} onClick={alternarTabela}>Ver tabela de dados</Button>
<div id="gf-tabela" hidden={!mostrarTabela}><Table>…meses e total…</Table></div>`,
  },
  "dados/tabelas": {
    label: "Tabela avançada [KIT SEM-504]",
    desc: "Ordenação, filtros (busca + status), paginação, seleção em lote, export CSV, EmptyState e Skeleton. Copie snippet.",
    filename: "TableAdvanced.jsx",
    prompt:
      "Crie Tabela avançada com ordenação, filtros, paginação, seleção, EmptyState e Skeleton usando semec-ds-react",
    usage: tableAdvancedUsage,
  },
};
