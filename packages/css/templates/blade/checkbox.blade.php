{{-- Parcial "checkbox" (Blade). Uso: @include('semec::checkbox', ['id' => 'declaracao', 'rotulo' => 'Declaro que as informações são verdadeiras', 'obrigatorio' => true]) — com 'opcoes', vira um grupo em <fieldset>; 'valor' é a lista das marcadas e o primeiro checkbox leva o id (#id no resumo). --}}
@php
  $semecId = (string) (($id ?? null) ?: '');
  $semecNome = ($nome ?? null) ?: $semecId;
  $semecValor = $valor ?? null;
  $semecDica = ($dica ?? null) ?: null;
  $semecErro = ($erro ?? null) ?: null;
  $semecDicaId = ($semecDica !== null && $semecErro === null) ? $semecId . '-hint' : null;
  $semecErroId = $semecErro !== null ? $semecId . '-error' : null;
  $semecDescritores = implode(' ', array_filter([$semecDicaId, $semecErroId]));
  $semecObrigatorio = !empty($obrigatorio);
  $semecOpcoes = array_values(is_array($opcoes ?? null) ? $opcoes : []);
  $semecMarcados = array_map('strval', array_filter((array) ($semecValor ?? []), 'is_scalar'));
@endphp
@if (empty($semecOpcoes))
<div class="semec-form-field">
  <label class="semec-choice"><input type="checkbox" id="{{ $semecId }}" name="{{ $semecNome }}" @if (is_scalar($semecValor) && (string) $semecValor !== '') value="{{ $semecValor }}" @endif class="semec-checkbox" @if (!empty($marcado)) checked @endif @if ($semecObrigatorio) required @endif @if (!empty($desabilitado)) disabled @endif @if ($semecErro !== null) aria-invalid="true" @endif @if ($semecDescritores !== '') aria-describedby="{{ $semecDescritores }}" @endif> {{ $rotulo ?? '' }}@if ($semecObrigatorio)<span class="semec-label__required" aria-hidden="true"> *</span>@endif</label>
@else
<fieldset class="semec-form-field" @if (!empty($desabilitado)) disabled @endif @if ($semecDescritores !== '') aria-describedby="{{ $semecDescritores }}" @endif>
  <legend class="semec-label">{{ $rotulo ?? '' }}@if ($semecObrigatorio)<span class="semec-label__required" aria-hidden="true"> *</span>@endif</legend>
@foreach ($semecOpcoes as $semecI => $semecOpcao)
  <label class="semec-choice"><input type="checkbox" id="{{ $semecI === 0 ? $semecId : $semecId . '-' . ($semecI + 1) }}" name="{{ $semecNome }}" value="{{ $semecOpcao['valor'] ?? '' }}" class="semec-checkbox" @if (in_array((string) ($semecOpcao['valor'] ?? ''), $semecMarcados, true)) checked @endif @if ($semecErro !== null) aria-invalid="true" @endif> {{ $semecOpcao['texto'] ?? '' }}</label>
@endforeach
@endif
@if ($semecDicaId !== null)
  <p id="{{ $semecDicaId }}" class="semec-hint">{{ $semecDica }}</p>
@endif
@if ($semecErroId !== null)
  <p id="{{ $semecErroId }}" class="semec-error">{{ $semecErro }}</p>
@endif
@if (empty($semecOpcoes))
</div>
@else
</fieldset>
@endif
