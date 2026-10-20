{{-- Parcial "combobox" (Blade). Uso: @include('semec::combobox', ['id' => 'escola', 'rotulo' => 'Escola', 'opcao_vazia' => 'Selecione a escola', 'opcoes' => [['valor' => 'emef-aponia', 'texto' => 'EMEF Aponiã']]]) — um <select> dentro do <semec-combobox> (@semec/ds-elements); o campo de busca assume o id (#id no resumo). --}}
@php
  $semecId = (string) (($id ?? null) ?: '');
  $semecValor = $valor ?? null;
  $semecValorPresente = $semecValor !== null && $semecValor !== '';
  $semecDica = ($dica ?? null) ?: null;
  $semecErro = ($erro ?? null) ?: null;
  $semecDicaId = ($semecDica !== null && $semecErro === null) ? $semecId . '-hint' : null;
  $semecErroId = $semecErro !== null ? $semecId . '-error' : null;
  $semecDescritores = implode(' ', array_filter([$semecDicaId, $semecErroId]));
  $semecObrigatorio = !empty($obrigatorio);
@endphp
<div class="semec-form-field">
  <label for="{{ $semecId }}" class="semec-label">{{ $rotulo ?? '' }}@if ($semecObrigatorio)<span class="semec-label__required" aria-hidden="true"> *</span>@endif</label>
  <semec-combobox class="semec-combobox" @if (($texto_vazio ?? null) ?: false) empty-text="{{ $texto_vazio }}" @endif>
    <select id="{{ $semecId }}" name="{{ ($nome ?? null) ?: $semecId }}" class="semec-field" @if ($semecObrigatorio) required @endif @if (!empty($desabilitado)) disabled @endif @if ($semecErro !== null) aria-invalid="true" @endif @if ($semecDescritores !== '') aria-describedby="{{ $semecDescritores }}" @endif>
@if (($opcao_vazia ?? null) ?: false)
      <option value="">{{ $opcao_vazia }}</option>
@endif
@foreach (($opcoes ?? []) as $semecOpcao)
      <option value="{{ $semecOpcao['valor'] ?? '' }}" @if ($semecValorPresente && (string) ($semecOpcao['valor'] ?? '') === (string) $semecValor) selected @endif>{{ $semecOpcao['texto'] ?? '' }}</option>
@endforeach
    </select>
  </semec-combobox>
@if ($semecDicaId !== null)
  <p id="{{ $semecDicaId }}" class="semec-hint">{{ $semecDica }}</p>
@endif
@if ($semecErroId !== null)
  <p id="{{ $semecErroId }}" class="semec-error">{{ $semecErro }}</p>
@endif
</div>
