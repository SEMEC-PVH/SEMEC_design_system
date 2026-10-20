{{-- Parcial "pular-para-o-conteudo" (Blade). Uso: @include('semec::pular-para-o-conteudo', ['texto' => 'Pular para o conteúdo principal']) --}}
<a href="#{{ ($alvo ?? null) ?: 'conteudo' }}" class="semec-skip-link">{{ ($texto ?? null) ?: 'Pular para o conteúdo principal' }}</a>
