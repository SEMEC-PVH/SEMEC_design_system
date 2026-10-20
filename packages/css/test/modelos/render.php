<?php
/**
 * Renderiza os casos de fixtures.json com os modelos PHP, Twig e Blade.
 * Lê os casos (JSON) da entrada padrão e escreve na saída
 *   { "php": {id: html}, "twig": {id: html}, "blade": {id: html} }
 * ou, com o argumento "twig-sem-autoescape", { "twig-sem-autoescape": {...} }.
 * Twig roda com strict_variables (como o Symfony em dev) e também com o
 * autoescape do ambiente desligado: a parcial liga o seu próprio.
 */

declare(strict_types=1);

error_reporting(E_ALL);
set_error_handler(static function (int $nivel, string $mensagem, string $arquivo, int $linha): bool {
    throw new ErrorException($mensagem, 0, $nivel, $arquivo, $linha);
});

require __DIR__ . '/php/vendor/autoload.php';

$templates = dirname(__DIR__, 2) . '/templates';
$filhos = __DIR__ . '/filhos';
$casos = json_decode((string) stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);

const CONTEUDO_PAGINA = '<h1 class="semec-heading semec-heading--1">Solicitação de transferência</h1><p>Conteúdo da página.</p>';

// PHP puro
require $templates . '/php/semec.php';

function render_php(array $caso): string
{
    $dados = $caso['dados'];
    if ($caso['parcial'] === 'pagina') {
        $dados['conteudo'] = static function (): void {
            echo CONTEUDO_PAGINA;
        };
    }
    return semec_render($caso['parcial'], $dados);
}

// Twig
function twig_env(string $templates, string $filhos, $autoescape): \Twig\Environment
{
    $loader = new \Twig\Loader\FilesystemLoader([$filhos]);
    $loader->addPath($templates . '/twig', 'semec');
    return new \Twig\Environment($loader, ['autoescape' => $autoescape, 'strict_variables' => true, 'cache' => false]);
}

function render_twig(\Twig\Environment $twig, array $caso): string
{
    if ($caso['parcial'] === 'pagina') {
        return $twig->render('pagina.html.twig', $caso['dados']);
    }
    // O uso documentado: include com "only" (a parcial não herda o contexto).
    $chamada = $twig->createTemplate("{% include '@semec/" . $caso['parcial'] . ".html.twig' with dados only %}");
    return $chamada->render(['dados' => $caso['dados']]);
}

// Blade (illuminate/view sem o Laravel)
function blade_factory(string $templates, string $filhos): \Illuminate\View\Factory
{
    $fs = new \Illuminate\Filesystem\Filesystem();
    $cache = sys_get_temp_dir() . '/semec-blade-' . getmypid();
    if (!is_dir($cache)) {
        mkdir($cache, 0777, true);
    }
    $container = new \Illuminate\Container\Container();
    \Illuminate\Container\Container::setInstance($container);
    $compiler = new \Illuminate\View\Compilers\BladeCompiler($fs, $cache);
    $resolver = new \Illuminate\View\Engines\EngineResolver();
    $resolver->register('blade', static fn () => new \Illuminate\View\Engines\CompilerEngine($compiler, $fs));
    $finder = new \Illuminate\View\FileViewFinder($fs, [$filhos]);
    $factory = new \Illuminate\View\Factory($resolver, $finder, new \Illuminate\Events\Dispatcher($container));
    $factory->setContainer($container);
    $factory->addNamespace('semec', $templates . '/blade');
    $container->instance(\Illuminate\Contracts\View\Factory::class, $factory);
    return $factory;
}

function render_blade(\Illuminate\View\Factory $blade, array $caso): string
{
    if ($caso['parcial'] === 'pagina') {
        return $blade->make('pagina', $caso['dados'])->render();
    }
    // O uso documentado: @include numa view (aqui, uma view mínima que só inclui a parcial).
    return $blade->make('incluir', ['parcial' => 'semec::' . $caso['parcial'], 'dados' => $caso['dados']])->render();
}

// O Twig guarda as classes compiladas no processo, com um nome que não depende
// do autoescape: o ambiente sem autoescape roda num processo separado.
$modo = $argv[1] ?? 'principal';
$saida = [];
if ($modo === 'twig-sem-autoescape') {
    $twigSemAutoescape = twig_env($templates, $filhos, false);
    foreach ($casos as $caso) {
        $saida['twig-sem-autoescape'][$caso['id']] = render_twig($twigSemAutoescape, $caso);
    }
} else {
    $twig = twig_env($templates, $filhos, 'html');
    $blade = blade_factory($templates, $filhos);
    foreach ($casos as $caso) {
        $saida['php'][$caso['id']] = render_php($caso);
        $saida['twig'][$caso['id']] = render_twig($twig, $caso);
        $saida['blade'][$caso['id']] = render_blade($blade, $caso);
    }
}

echo json_encode($saida, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
