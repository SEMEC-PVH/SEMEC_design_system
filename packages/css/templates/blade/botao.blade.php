{{-- Parcial "botao" (Blade). Uso: @include('semec::botao', ['texto' => 'Enviar', 'tipo' => 'submit']) --}}
@php
  $semecVariante = in_array($variante ?? null, ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'success', 'link'], true) ? $variante : 'primary';
  $semecTamanho = in_array($tamanho ?? null, ['sm', 'md', 'lg'], true) ? $tamanho : 'md';
  $semecClasse = 'semec-btn semec-btn--' . $semecVariante . ($semecTamanho !== 'md' ? ' semec-btn--' . $semecTamanho : '');
  $semecDesabilitado = !empty($desabilitado);
  $semecValor = $valor ?? null;
  // Parâmetro "atributos": só data-*, aria-* e alguns atributos de formulário; nome minúsculo,
  // fora os que a parcial já gera. Valor escapado; true = booleano; false, null e vazio omitem.
  $semecExtras = '';
  foreach ((is_array($atributos ?? null) ? $atributos : []) as $semecNome => $semecV) {
    $semecNome = (string) $semecNome;
    if (preg_match('/^[a-z][a-z0-9-]*$/', $semecNome) !== 1 || in_array($semecNome, ['aria-label', 'aria-disabled'], true)) continue;
    if (!in_array($semecNome, ['inputmode', 'enterkeyhint', 'maxlength', 'minlength', 'pattern', 'min', 'max', 'step', 'rows', 'cols', 'placeholder', 'readonly', 'spellcheck', 'autocapitalize', 'size', 'multiple', 'accept', 'form', 'formnovalidate', 'title', 'lang', 'dir'], true) && preg_match('/^(data|aria)-[a-z0-9]/', $semecNome) !== 1) continue;
    if ($semecV === true) $semecExtras .= ' ' . $semecNome;
    elseif (is_scalar($semecV) && $semecV !== false && (string) $semecV !== '') $semecExtras .= ' ' . $semecNome . '="' . e((string) $semecV) . '"';
  }
@endphp
@if (($href ?? null) ?: false)
<a @if (!$semecDesabilitado) href="{{ $href }}" @endif class="{{ $semecClasse }}" @if (($id ?? null) ?: false) id="{{ $id }}" @endif @if ($semecDesabilitado) aria-disabled="true" @endif @if (($rotulo ?? null) ?: false) aria-label="{{ $rotulo }}" @endif{!! $semecExtras !!}>{{ $texto ?? '' }}</a>
@else
<button type="{{ in_array($tipo ?? null, ['button', 'submit', 'reset'], true) ? $tipo : 'button' }}" class="{{ $semecClasse }}" @if (($id ?? null) ?: false) id="{{ $id }}" @endif @if (($nome ?? null) ?: false) name="{{ $nome }}" @endif @if ($semecValor !== null && $semecValor !== '') value="{{ $semecValor }}" @endif @if ($semecDesabilitado) disabled @endif @if (($rotulo ?? null) ?: false) aria-label="{{ $rotulo }}" @endif{!! $semecExtras !!}>{{ $texto ?? '' }}</button>
@endif
