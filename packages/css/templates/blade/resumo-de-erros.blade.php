{{-- Parcial "resumo-de-erros" (Blade). Uso: @include('semec::resumo-de-erros', ['erros' => [['campo' => 'email', 'mensagem' => 'Informe um e-mail válido.']]]) — sem erros, não imprime nada. --}}
@php
  // Aceita a lista [['campo' => …, 'mensagem' => …]] ou o mapa ['cpf' => '…'] (o mesmo que o
  // "erro" de cada campo). Item sem campo ou sem mensagem não vira link.
  $semecItens = [];
  foreach ((is_array($erros ?? null) ? $erros : []) as $semecChave => $semecErro) {
    if (is_array($semecErro)) $semecItens[] = [$semecErro['campo'] ?? null, $semecErro['mensagem'] ?? null];
    elseif (is_string($semecChave)) $semecItens[] = [$semecChave, $semecErro];
  }
  $semecItens = array_values(array_filter($semecItens, static fn (array $i): bool => is_scalar($i[0]) && (string) $i[0] !== '' && is_scalar($i[1]) && (string) $i[1] !== ''));
@endphp
@if (!empty($semecItens))
@php
  $semecId = (string) (($id ?? null) ?: 'resumo-de-erros');
  $semecFocar = !empty($focar ?? true);
@endphp
<div id="{{ $semecId }}" class="semec-error-summary" role="alert" tabindex="-1" aria-labelledby="{{ $semecId }}-titulo" @if ($semecFocar) autofocus @endif>
  <h2 id="{{ $semecId }}-titulo" class="semec-error-summary__title">{{ ($titulo ?? null) ?: 'Há um problema' }}</h2>
  <ul class="semec-error-summary__list">
@foreach ($semecItens as [$semecCampo, $semecMensagem])
    <li><a href="#{{ $semecCampo }}">{{ $semecMensagem }}</a></li>
@endforeach
  </ul>
</div>
@endif
