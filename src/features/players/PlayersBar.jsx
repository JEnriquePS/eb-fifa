export default function PlayersBar({ players, activeId, onSwitch, onAdd, onRename, onRemove }) {
  const add = () => {
    const name = window.prompt("Nombre del jugador:");
    if (name?.trim()) onAdd(name.trim());
  };

  const rename = () => {
    const current = players.find((p) => p.id === activeId);
    const name = window.prompt("Nuevo nombre:", current?.name ?? "");
    if (name?.trim()) onRename(activeId, name.trim());
  };

  const remove = () => {
    const current = players.find((p) => p.id === activeId);
    if (
      window.confirm(
        `Se eliminará a "${current?.name}" y todos sus pronósticos permanentemente. ¿Continuar?`
      )
    ) {
      onRemove(activeId);
    }
  };

  return (
    <div className="border-b border-line bg-turf/60">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2">
        <span className="shrink-0 font-cond text-xs font-bold uppercase tracking-widest text-mist">
          Jugadores
        </span>
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => onSwitch(p.id)}
            aria-pressed={p.id === activeId}
            className={`shrink-0 cursor-pointer rounded-full border px-3 py-1 font-cond text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-grass focus-visible:ring-offset-2 focus-visible:ring-offset-night ${
              p.id === activeId
                ? "border-grass bg-grass/15 text-grass"
                : "border-line text-mist hover:border-mist hover:text-chalk"
            }`}
          >
            {p.name}
          </button>
        ))}
        <button
          onClick={add}
          className="shrink-0 cursor-pointer rounded-full border border-dashed border-mist/50 px-3 py-1 font-cond text-sm font-semibold text-mist transition-colors duration-150 hover:border-grass hover:text-grass focus:outline-none focus-visible:ring-2 focus-visible:ring-grass focus-visible:ring-offset-2 focus-visible:ring-offset-night"
        >
          + Agregar
        </button>
        <span className="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden="true" />
        <button
          onClick={rename}
          className="shrink-0 cursor-pointer font-cond text-xs uppercase tracking-wider text-mist underline-offset-2 hover:text-chalk hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-grass rounded"
        >
          Renombrar
        </button>
        {players.length > 1 && (
          <button
            onClick={remove}
            className="shrink-0 cursor-pointer font-cond text-xs uppercase tracking-wider text-mist underline-offset-2 hover:text-card hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-card rounded"
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}
