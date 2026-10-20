{{-- Parcial "resumo-de-erros" (Blade). Uso: @include('semec::resumo-de-erros', ['erros' => [['campo' => 'email', 'mensagem' => 'Informe um e-mail válido.']]]) — sem erros, não imprime nada. --}}
@if (!empty($erros ?? []))
@php
  $semecId = (string) (($id ?? null) ?: 'resumo-de-erros');
  $semecFocar = !empty($focar ?? true);
@endphp
<div id="{{ $semecId }}" class="semec-error-summary" role="alert" tabindex="-1" aria-labelledby="{{ $semecId }}-titulo" @if ($semecFocar) autofocus @endif>
  <h2 id="{{ $semecId }}-titulo" class="semec-error-summary__title">{{ ($titulo ?? null) ?: 'Há um problema' }}</h2>
  <ul class="semec-error-summary__list">
@foreach ($erros as $semecErro)
    <li><a href="#{{ $semecErro['campo'] ?? '' }}">{{ $semecErro['mensagem'] ?? '' }}</a></li>
@endforeach
  </ul>
</div>
@endif
