{{-- Parcial "cabecalho" (Blade). Uso: @include('semec::cabecalho', ['marca_src' => '/img/marca.svg', 'servico' => 'Matrícula', 'nav' => [['href' => '/matricula', 'texto' => 'Matrícula', 'atual' => true]]]) --}}
<header class="semec-header">
  <a href="{{ ($inicio ?? null) ?: '/' }}" class="semec-header__brand">
@if (($marca_src ?? null) ?: false)
    <img src="{{ $marca_src }}" alt="{{ ($marca_alt ?? null) ?: 'Prefeitura de Porto Velho' }}" width="{{ ($marca_largura ?? null) ?: 90 }}" height="{{ ($marca_altura ?? null) ?: 36 }}">
    <span aria-hidden="true" class="semec-header__divider"></span>
@endif
    <span class="semec-header__org">{{ ($orgao ?? null) ?: 'SEMEC' }}@if (($servico ?? null) ?: false) <span aria-hidden="true" class="semec-header__separator">|</span> <span class="semec-header__service">{{ $servico }}</span>@endif</span>
    <span class="semec-sr-only">— {{ ($rotulo_inicio ?? null) ?: 'ir para o início' }}</span>
  </a>
@if (!empty($nav ?? []))
  <nav aria-label="{{ ($nav_rotulo ?? null) ?: 'Menu principal' }}" class="semec-header__nav">
@foreach ($nav as $semecItem)
    <a href="{{ $semecItem['href'] ?? '' }}" class="semec-header__link" @if (!empty($semecItem['atual'])) aria-current="page" @endif>{{ $semecItem['texto'] ?? '' }}</a>
@endforeach
  </nav>
@endif
</header>
