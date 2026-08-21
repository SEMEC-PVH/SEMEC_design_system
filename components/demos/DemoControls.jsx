export default function DemoControls() {
  return (
    <div className="demo-controls">
      <div className="demo-tabs">
        <button className="active">
          Todos <span className="count">40</span>
        </button>
        <button>
          Serviços <span className="count">18</span>
        </button>
        <button>
          Requerimentos <span className="count">12</span>
        </button>
        <button>
          Informações <span className="count">7</span>
        </button>
        <button>
          Acessos <span className="count">3</span>
        </button>
      </div>
      <div className="demo-search">
        <div className="field">
          <span className="icon">⌕</span>
          <input
            type="search"
            placeholder="Buscar serviço ou informação… (ex.: IPTU, restituição, certidão)"
          />
        </div>
      </div>
      <div className="demo-chips">
        <button className="chip active">Todas</button>
        <button className="chip">IPTU</button>
        <button className="chip">ITBI</button>
        <button className="chip">Taxas</button>
        <button className="chip">Simples Nacional</button>
        <button className="chip">REFIS</button>
      </div>
    </div>
  );
}