<?php
/**
 * Modelos de servidor do @semec/ds-css para PHP puro (ADR-030).
 *
 *   require __DIR__ . '/vendor-semec/php/semec.php';
 *   echo semec_render('campo', ['id' => 'email', 'rotulo' => 'E-mail', 'tipo' => 'email']);
 *
 * Toda saída passa por semec_e() (htmlspecialchars com ENT_QUOTES). Nenhum
 * parâmetro é impresso como HTML cru. Parâmetros documentados em ../README.md.
 */

declare(strict_types=1);

if (!function_exists('semec_render')) {
    /** Escapa texto e valor de atributo (aspas simples e duplas incluídas). */
    function semec_e($valor): string
    {
        if ($valor === null || $valor === false) {
            return '';
        }
        return htmlspecialchars((string) $valor, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    /**
     * Atributo com valor escapado. Nulo, false ou vazio omitem o atributo;
     * true gera o atributo booleano (ex.: required).
     */
    function semec_attr(string $nome, $valor): string
    {
        if ($valor === null || $valor === false || $valor === '') {
            return '';
        }
        if ($valor === true) {
            return ' ' . $nome;
        }
        return ' ' . $nome . '="' . semec_e($valor) . '"';
    }

    /** Valor do parâmetro, ou o padrão quando ausente, nulo ou vazio. */
    function semec_param(array $p, string $chave, $padrao = null)
    {
        $valor = $p[$chave] ?? null;
        return ($valor === null || $valor === '') ? $padrao : $valor;
    }

    /** Só aceita um valor da lista; qualquer outro vira o padrão (nada de classe arbitrária). */
    function semec_opcao(array $p, string $chave, array $permitidos, string $padrao): string
    {
        $valor = $p[$chave] ?? null;
        return in_array($valor, $permitidos, true) ? $valor : $padrao;
    }

    /** Renderiza uma parcial e devolve o HTML. */
    function semec_render(string $parcial, array $p = []): string
    {
        $parciais = ['alerta', 'botao', 'cabecalho', 'campo', 'pagina', 'pular-para-o-conteudo', 'resumo-de-erros', 'rodape'];
        if (!in_array($parcial, $parciais, true)) {
            throw new InvalidArgumentException('Parcial desconhecida: ' . $parcial);
        }
        ob_start();
        try {
            (static function (array $p, string $arquivo): void {
                require $arquivo;
            })($p, __DIR__ . '/' . $parcial . '.php');
        } catch (Throwable $erro) {
            ob_end_clean();
            throw $erro;
        }
        return (string) ob_get_clean();
    }

    /** Conteúdo de bloco da página: função que imprime HTML do app, ou texto (escapado). */
    function semec_bloco($bloco): void
    {
        if (is_callable($bloco)) {
            $bloco();
        } elseif ($bloco !== null) {
            echo semec_e($bloco);
        }
    }
}
