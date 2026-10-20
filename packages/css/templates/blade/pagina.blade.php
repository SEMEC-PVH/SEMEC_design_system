{{--
  Parcial "pagina" (Blade): layout base. Uso, numa view filha:
    @extends('semec::pagina')
    @section('conteudo') <h1 class="semec-heading semec-heading--1">Título</h1> @endsection
  Parâmetros (titulo, css_href, cabecalho, rodape…) vêm dos dados da view.
  Seções: conteudo (dentro do <main>) e head (fim do <head>).
--}}
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ $titulo ?? '' }}</title>
@if (($fontes_href ?? null) !== false)
  <link rel="stylesheet" href="{{ ($fontes_href ?? null) ?: '/css/fonts.css' }}">
@endif
  <link rel="stylesheet" href="{{ ($css_href ?? null) ?: '/css/semec-ds.css' }}">
@if (($elements_src ?? null) !== false)
  <script type="module" src="{{ ($elements_src ?? null) ?: '/js/semec-elements.js' }}"></script>
@endif
@yield('head')
</head>
<body>
{{-- Renderização isolada (sem herdar as variáveis desta view); a saída já vem escapada. --}}
{!! $__env->make('semec::pular-para-o-conteudo', ['texto' => ($pular_texto ?? null) ?: null])->render() !!}
@if (!empty($cabecalho ?? null))
{!! $__env->make('semec::cabecalho', $cabecalho)->render() !!}
@endif
<main id="conteudo" tabindex="-1">
@yield('conteudo')
</main>
@if (!empty($rodape ?? null))
{!! $__env->make('semec::rodape', $rodape)->render() !!}
@endif
</body>
</html>
