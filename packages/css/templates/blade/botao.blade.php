{{-- Parcial "botao" (Blade). Uso: @include('semec::botao', ['texto' => 'Enviar', 'tipo' => 'submit']) --}}
@php
  $semecVariante = in_array($variante ?? null, ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'success', 'link'], true) ? $variante : 'primary';
  $semecTamanho = in_array($tamanho ?? null, ['sm', 'md', 'lg'], true) ? $tamanho : 'md';
  $semecClasse = 'semec-btn semec-btn--' . $semecVariante . ($semecTamanho !== 'md' ? ' semec-btn--' . $semecTamanho : '');
  $semecDesabilitado = !empty($desabilitado);
  $semecValor = $valor ?? null;
@endphp
@if (($href ?? null) ?: false)
<a @if (!$semecDesabilitado) href="{{ $href }}" @endif class="{{ $semecClasse }}" @if (($id ?? null) ?: false) id="{{ $id }}" @endif @if ($semecDesabilitado) aria-disabled="true" @endif @if (($rotulo ?? null) ?: false) aria-label="{{ $rotulo }}" @endif>{{ $texto ?? '' }}</a>
@else
<button type="{{ in_array($tipo ?? null, ['button', 'submit', 'reset'], true) ? $tipo : 'button' }}" class="{{ $semecClasse }}" @if (($id ?? null) ?: false) id="{{ $id }}" @endif @if (($nome ?? null) ?: false) name="{{ $nome }}" @endif @if ($semecValor !== null && $semecValor !== '') value="{{ $semecValor }}" @endif @if ($semecDesabilitado) disabled @endif @if (($rotulo ?? null) ?: false) aria-label="{{ $rotulo }}" @endif>{{ $texto ?? '' }}</button>
@endif
