{{-- Parcial "campo" (Blade). Uso: @include('semec::campo', ['id' => 'email', 'rotulo' => 'E-mail', 'tipo' => 'email', 'obrigatorio' => true]) --}}
@php
  $semecTipo = in_array($tipo ?? null, ['text', 'email', 'tel', 'number', 'date', 'password', 'url', 'search', 'textarea', 'select'], true) ? $tipo : 'text';
  $semecId = (string) (($id ?? null) ?: '');
  $semecValor = $valor ?? null;
  $semecValorPresente = $semecValor !== null && $semecValor !== '';
  $semecDica = ($dica ?? null) ?: null;
  $semecErro = ($erro ?? null) ?: null;
  // Como no FormField do kit: com erro, a mensagem substitui a dica.
  $semecDicaId = ($semecDica !== null && $semecErro === null) ? $semecId . '-hint' : null;
  $semecErroId = $semecErro !== null ? $semecId . '-error' : null;
  $semecDescritores = implode(' ', array_filter([$semecDicaId, $semecErroId]));
  $semecObrigatorio = !empty($obrigatorio);
  $semecDesabilitado = !empty($desabilitado);
  $semecControle = $semecTipo === 'textarea' || $semecTipo === 'select' ? $semecTipo : 'input';
  // Parâmetro "atributos": só data-*, aria-* e alguns atributos de formulário; nome minúsculo,
  // fora os que a parcial já gera. Valor escapado; true = booleano; false, null e vazio omitem.
  $semecExtras = '';
  foreach ((is_array($atributos ?? null) ? $atributos : []) as $semecNome => $semecV) {
    $semecNome = (string) $semecNome;
    if (preg_match('/^[a-z][a-z0-9-]*$/', $semecNome) !== 1 || in_array($semecNome, ['aria-invalid', 'aria-describedby'], true)) continue;
    if (!in_array($semecNome, ['inputmode', 'enterkeyhint', 'maxlength', 'minlength', 'pattern', 'min', 'max', 'step', 'rows', 'cols', 'placeholder', 'readonly', 'spellcheck', 'autocapitalize', 'size', 'multiple', 'accept', 'form', 'formnovalidate', 'title', 'lang', 'dir'], true) && preg_match('/^(data|aria)-[a-z0-9]/', $semecNome) !== 1) continue;
    if ($semecV === true) $semecExtras .= ' ' . $semecNome;
    elseif (is_scalar($semecV) && $semecV !== false && (string) $semecV !== '') $semecExtras .= ' ' . $semecNome . '="' . e((string) $semecV) . '"';
  }
@endphp
<div class="semec-form-field">
  <label for="{{ $semecId }}" class="semec-label">{{ $rotulo ?? '' }}@if ($semecObrigatorio)<span class="semec-label__required" aria-hidden="true"> *</span>@endif</label>
  <{{ $semecControle }} id="{{ $semecId }}" name="{{ ($nome ?? null) ?: $semecId }}" @if ($semecControle === 'input') type="{{ $semecTipo }}" @endif class="semec-field" @if ($semecControle === 'input' && $semecValorPresente) value="{{ $semecValor }}" @endif @if (($autocomplete ?? null) ?: false) autocomplete="{{ $autocomplete }}" @endif @if ($semecObrigatorio) required @endif @if ($semecDesabilitado) disabled @endif @if ($semecErro !== null) aria-invalid="true" @endif @if ($semecDescritores !== '') aria-describedby="{{ $semecDescritores }}" @endif{!! $semecExtras !!}>
@if ($semecControle === 'textarea')
{{ $semecValorPresente ? $semecValor : '' }}</textarea>
@elseif ($semecControle === 'select')
@if (($opcao_vazia ?? null) ?: false)
    <option value="">{{ $opcao_vazia }}</option>
@endif
@foreach (($opcoes ?? []) as $semecOpcao)
    <option value="{{ $semecOpcao['valor'] ?? '' }}" @if ($semecValorPresente && (string) ($semecOpcao['valor'] ?? '') === (string) $semecValor) selected @endif>{{ $semecOpcao['texto'] ?? '' }}</option>
@endforeach
  </select>
@endif
@if ($semecDicaId !== null)
  <p id="{{ $semecDicaId }}" class="semec-hint">{{ $semecDica }}</p>
@endif
@if ($semecErroId !== null)
  <p id="{{ $semecErroId }}" class="semec-error">{{ $semecErro }}</p>
@endif
</div>
