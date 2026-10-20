{{-- Parcial "rodape" (Blade). Uso: @include('semec::rodape', ['secoes' => [['titulo' => 'Serviços', 'links' => [['href' => '/matricula', 'texto' => 'Matrícula']]]]]) --}}
<footer class="semec-footer">
@if (!empty($secoes ?? []))
  <div class="semec-footer__content">
@foreach ($secoes as $semecSecao)
    <div class="semec-footer__section">
      <h2 class="semec-footer__title">{{ $semecSecao['titulo'] ?? '' }}</h2>
      <ul class="semec-footer__links">
@foreach (($semecSecao['links'] ?? []) as $semecLink)
        <li><a href="{{ $semecLink['href'] ?? '' }}" class="semec-footer__link">{{ $semecLink['texto'] ?? '' }}</a></li>
@endforeach
      </ul>
    </div>
@endforeach
  </div>
@endif
  <div class="semec-footer__bottom">{{ ($texto_final ?? null) ?: 'Prefeitura de Porto Velho · SEMEC' }}</div>
</footer>
