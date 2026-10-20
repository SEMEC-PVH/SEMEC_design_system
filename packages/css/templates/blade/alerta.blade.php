{{-- Parcial "alerta" (Blade). Uso: @include('semec::alerta', ['variante' => 'warning', 'titulo' => 'Prazo', 'descricao' => 'As solicitações vão até 30 de novembro.']) — ícones Lucide, como no Alert do kit. --}}
@php
  $semecVariante = in_array($variante ?? null, ['info', 'success', 'warning', 'danger'], true) ? $variante : 'info';
  // Como no Alert do kit: só "danger" interrompe (role="alert"); os demais são role="status".
  $semecAnuncio = in_array($anuncio ?? null, ['assertive', 'polite', 'off'], true) ? $anuncio : ($semecVariante === 'danger' ? 'assertive' : 'polite');
  $semecPapel = ['assertive' => 'alert', 'polite' => 'status', 'off' => null][$semecAnuncio];
@endphp
<div @if (($id ?? null) ?: false) id="{{ $id }}" @endif @if ($semecPapel !== null) role="{{ $semecPapel }}" @endif class="semec-alert semec-alert--{{ $semecVariante }}">
@if ($semecVariante === 'success')
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="m16 9-5.5 5.5L8 12"></path></svg>
@elseif ($semecVariante === 'warning')
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
@elseif ($semecVariante === 'danger')
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>
@else
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
@endif
@if (($titulo ?? null) ?: false)
  <div class="semec-alert__title">{{ $titulo }}</div>
@endif
  <div class="semec-alert__description"><p>{{ $descricao ?? '' }}</p></div>
</div>
