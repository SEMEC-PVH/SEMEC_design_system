<?php
/**
 * Roda os exemplos do templates/README.md como estão (CONS-01, CONS-02).
 * O teste (modelos.test.mjs) extrai os trechos para .cache/exemplos/ e chama
 * este script, que devolve { php|twig|blade: { get, post } } na saída padrão:
 *   get   primeiro acesso, sem dados nem erros;
 *   post  envio com o CPF vazio (o erro "Informe o CPF.").
 * PHP: o trecho valida o $_POST sozinho. Twig: strict_variables, como o Symfony
 * em desenvolvimento. Blade: illuminate/view com os helpers do Laravel que o
 * trecho usa (view, old, csrf_field, $errors).
 */

declare(strict_types=1);

error_reporting(E_ALL);
set_error_handler(static function (int $nivel, string $mensagem, string $arquivo, int $linha): bool {
    throw new ErrorException($mensagem, 0, $nivel, $arquivo, $linha);
});

require __DIR__ . '/php/vendor/autoload.php';

$dir = __DIR__ . '/.cache/exemplos';
$templates = dirname(__DIR__, 2) . '/templates';
$layout = [
    'titulo' => 'Transferência escolar — SEMEC',
    'cabecalho' => ['marca_src' => '/img/marca.svg', 'servico' => 'Matrícula e transferência'],
];
$cenarios = [
    'get' => ['metodo' => 'GET', 'post' => [], 'erros' => []],
    'post' => ['metodo' => 'POST', 'post' => ['cpf' => ''], 'erros' => ['cpf' => 'Informe o CPF.']],
];

// Helpers do Laravel usados no trecho Blade.
function old(string $chave, $padrao = null)
{
    return $_POST[$chave] ?? $padrao;
}
function csrf_field(): \Illuminate\Support\HtmlString
{
    return new \Illuminate\Support\HtmlString('<input type="hidden" name="_token" value="teste">');
}
function view(string $nome, array $dados = []): \Illuminate\Contracts\View\View
{
    return \Illuminate\Container\Container::getInstance()->make(\Illuminate\Contracts\View\Factory::class)->make($nome, $dados);
}

function blade(string $dir, string $templates): \Illuminate\View\Factory
{
    $fs = new \Illuminate\Filesystem\Filesystem();
    $cache = sys_get_temp_dir() . '/semec-blade-exemplos-' . getmypid();
    if (!is_dir($cache)) {
        mkdir($cache, 0777, true);
    }
    $container = new \Illuminate\Container\Container();
    \Illuminate\Container\Container::setInstance($container);
    $compiler = new \Illuminate\View\Compilers\BladeCompiler($fs, $cache);
    $resolver = new \Illuminate\View\Engines\EngineResolver();
    $resolver->register('blade', static fn () => new \Illuminate\View\Engines\CompilerEngine($compiler, $fs));
    $factory = new \Illuminate\View\Factory($resolver, new \Illuminate\View\FileViewFinder($fs, [$dir]), new \Illuminate\Events\Dispatcher($container));
    $factory->setContainer($container);
    $factory->addNamespace('semec', $templates . '/blade');
    $container->instance(\Illuminate\Contracts\View\Factory::class, $factory);
    return $factory;
}

$loader = new \Twig\Loader\FilesystemLoader([$dir]);
$loader->addPath($templates . '/twig', 'semec');
$twig = new \Twig\Environment($loader, ['autoescape' => 'html', 'strict_variables' => true, 'cache' => false]);
$blade = blade($dir, $templates);

$saida = [];
foreach ($cenarios as $nome => $c) {
    $_SERVER['REQUEST_METHOD'] = $c['metodo'];
    $_POST = $c['post'];

    ob_start();
    (static function (string $arquivo): void {
        require $arquivo;
    })($dir . '/exemplo.php');
    $saida['php'][$nome] = (string) ob_get_clean();

    $saida['twig'][$nome] = $twig->render('exemplo.html.twig', $layout + ['erros' => $c['erros'], 'dados' => $c['post']]);

    $erros = new \Illuminate\Support\ViewErrorBag();
    $erros->put('default', new \Illuminate\Support\MessageBag(array_map(static fn (string $m): array => [$m], $c['erros'])));
    $blade->share('errors', $erros);
    $saida['blade'][$nome] = $blade->make('exemplo', $layout)->render();
}

echo json_encode($saida, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
