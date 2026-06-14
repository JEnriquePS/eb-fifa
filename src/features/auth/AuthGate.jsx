import { useEffect, useState } from "react";
import { supabase, db } from "../../lib/supabase";

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "") },
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-7xl" role="img" aria-label="Balón">⚽</span>
          <h1 className="mt-4 font-display text-3xl">
            <span className="text-chalk">LA POLLA</span>{" "}
            <span className="text-gold">MUNDIALISTA</span>
          </h1>
          <p className="mt-1 font-cond text-mist text-sm tracking-wide">
            Copa Mundial FIFA 2026 · hora peruana 🇵🇪
          </p>
        </div>

        <div className="rounded-xl border border-line bg-panel p-6 shadow-lg">
          {sent ? (
            <div className="text-center">
              <span className="text-4xl" role="img" aria-label="Email">📧</span>
              <h2 className="mt-3 font-display text-lg text-chalk">¡Revisá tu correo!</h2>
              <p className="mt-2 font-cond text-sm text-mist leading-relaxed">
                Te enviamos un link a <strong className="text-chalk">{email}</strong>.
                Haz clic en el link para entrar — no necesitas contraseña.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="mt-4 cursor-pointer font-cond text-xs uppercase tracking-widest text-mist hover:text-chalk underline-offset-2 hover:underline"
              >
                Usar otro correo
              </button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-lg text-chalk mb-1">Entrar a la polla</h2>
              <p className="font-cond text-sm text-mist mb-5">
                Ingresa tu correo y te enviamos un link mágico — sin contraseña.
              </p>
              <form onSubmit={send} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="tucorreo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-line bg-night px-3 py-2.5 font-cond text-base text-chalk placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-grass focus:ring-offset-2 focus:ring-offset-panel"
                />
                {error && (
                  <p className="font-cond text-xs text-card" role="alert">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full cursor-pointer rounded-md bg-grass px-4 py-2.5 font-cond font-bold uppercase tracking-wider text-night transition-opacity duration-150 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-grass focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
                >
                  {loading ? "Enviando…" : "Enviar link de acceso"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-4 text-center font-cond text-xs uppercase tracking-widest text-mist">
          11 jun – 19 jul · 48 selecciones · 104 partidos
        </p>
      </div>
    </div>
  );
}

function NameSetup({ user, onDone }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await db.upsertProfile(user.id, name.trim());
    if (error) { setError(error.message); setLoading(false); return; }
    onDone();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-6xl" role="img" aria-label="Trofeo">🏆</span>
          <h1 className="mt-4 font-display text-2xl text-chalk">¡Bienvenido!</h1>
          <p className="mt-1 font-cond text-mist text-sm">
            ¿Cómo vas a aparecer en la tabla?
          </p>
        </div>

        <div className="rounded-xl border border-line bg-panel p-6 shadow-lg">
          <form onSubmit={save} className="flex flex-col gap-3">
            <input
              autoFocus
              required
              maxLength={30}
              placeholder="Tu nombre (ej: Pepito, El Crack)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-line bg-night px-3 py-2.5 font-cond text-base text-chalk placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-grass focus:ring-offset-2 focus:ring-offset-panel"
            />
            {error && <p className="font-cond text-xs text-card">{error}</p>}
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full cursor-pointer rounded-md bg-grass px-4 py-2.5 font-cond font-bold uppercase tracking-wider text-night transition-opacity duration-150 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-grass focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
            >
              {loading ? "Guardando…" : "Entrar a la polla →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <span className="text-5xl animate-spin inline-block" style={{ animationDuration: "1.2s" }} role="img" aria-label="Cargando">⚽</span>
        <p className="mt-4 font-cond uppercase tracking-widest text-mist text-sm">Cargando…</p>
      </div>
    </div>
  );
}

export default function AuthGate({ user, authLoading, children }) {
  const [profile, setProfile] = useState(undefined); // undefined=checking, null=no perfil
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    db.getProfile(user.id).then((p) => {
      setProfile(p ?? null);
      setChecking(false);
    });
  }, [user?.id]);

  const refreshProfile = () =>
    db.getProfile(user.id).then((p) => setProfile(p ?? null));

  if (authLoading || checking) return <LoadingScreen />;
  if (!user) return <LoginScreen />;
  if (!profile) return <NameSetup user={user} onDone={refreshProfile} />;
  return children;
}
