{{-- Parcial "radio-grupo" (Blade). Uso: @include('semec::radio-grupo', ['id' => 'turno', 'rotulo' => 'Turno', 'obrigatorio' => true, 'opcoes' => [['valor' => 'manha', 'texto' => 'Manhã'], ['valor' => 'tarde', 'texto' => 'Tarde']]]) — o primeiro rádio leva o id (#id no resumo), os outros id-2, id-3… --}}
@php
  $semecId = (string) (($id ?? null) ?: '');
  $semecNome = ($nome ?? null) ?: $semecId;
  $semecValor = $valor ?? null;
  $semecValorPresente = $semecValor !== null && $semecValor !== '';
  $semecDica = ($dica ?? null) ?: null;
  $semecErro = ($erro ?? null) ?: null;
  $semecDicaId = ($semecDica !== null && $semecErro === null) ? $semecId . '-hint' : null;
  $semecErroId = $semecErro !== null ? $semecId . '-error' : null;
  $semecDescritores = implode(' ', array_filter([$semecDicaId, $semecErroId]));
  $semecObrigatorio = !empty($obrigatorio);
@endphp
<fieldset class="semec-form-field" @if (!empty($desabilitado)) disabled @endif @if ($semecDescritores !== '') aria-describedby="{{ $semecDescritores }}" @endif>
  <legend class="semec-label">{{ $rotulo ?? '' }}@if ($semecObrigatorio)<span class="semec-label__required" aria-hidden="true"> *</span>@endif</legend>
@foreach (array_values($opcoes ?? []) as $semecI => $semecOpcao)
  <label class="semec-choice"><input type="radio" id="{{ $semecI === 0 ? $semecId : $semecId . '-' . ($semecI + 1) }}" name="{{ $semecNome }}" value="{{ $semecOpcao['valor'] ?? '' }}" class="semec-radio" @if ($semecValorPresente && (string) ($semecOpcao['valor'] ?? '') === (string) $semecValor) checked @endif @if ($semecObrigatorio) required @endif @if ($semecErro !== null) aria-invalid="true" @endif> {{ $semecOpcao['texto'] ?? '' }}</label>
@endforeach
@if ($semecDicaId !== null)
  <p id="{{ $semecDicaId }}" class="semec-hint">{{ $semecDica }}</p>
@endif
@if ($semecErroId !== null)
  <p id="{{ $semecErroId }}" class="semec-error">{{ $semecErro }}</p>
@endif
</fieldset>
