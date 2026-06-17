import { useEffect, useState } from "react";
import { supabase, db } from "../../lib/supabase";

const INPUT_CLS =
  "w-full rounded-md border border-line bg-night px-3 py-2.5 font-cond text-base text-chalk placeholder:text-mist focus:outline-none focus:ring-2 focus:ring-grass focus:ring-offset-2 focus:ring-offset-panel";
const BTN_CLS =
  "w-full cursor-pointer rounded-md bg-grass px-4 py-2.5 font-cond font-bold uppercase tracking-wider text-night transition-opacity duration-150 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-grass focus-visible:ring-offset-2 focus-visible:ring-offset-panel";

function Logo() {
  return (
    <div className="text-center mb-8">
      <span className="text-7xl" role="img" aria-label="Balón">⚽</span>
      <h1 className="mt-4 font-display text-3xl">
        <span className="text-chalk">LA QUINIELA</span>{" "}
        <span className="text-gold">MUNDIALISTA</span>
      </h1>
      <p className="mt-1 font-cond text-mist text-sm tracking-wide">
        Copa Mundial FIFA 2026 · hora peruana 🇵🇪
      </p>
      {/* Sponsor */}
      <div className="mt-5 flex items-end justify-center gap-3">
        <span className="font-cond text-sm uppercase tracking-widest text-mist">Presentado por</span>
        <img src={`${import.meta.env.BASE_URL}images/eb-logo-w.png`} alt="EB Consulting" className="h-10 object-contain" />
      </div>
    </div>
  );
}

function LoginScreen() {
  const alreadyRegistered = localStorage.getItem("eb_registered") === "true";
  const [step, setStep] = useState("code"); // "code" | "auth"
  const [mode, setMode] = useState(alreadyRegistered ? "login" : "register");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ACCESS_CODE = import.meta.env.VITE_ACCESS_CODE;

  const validateCode = (e) => {
    e.preventDefault();
    if (code.trim().toUpperCase() === ACCESS_CODE?.toUpperCase()) {
      setError(null);
      setStep("auth");
    } else {
      setError("Código incorrecto.");
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          setMode("login");
          setError("Ya tienes cuenta. Inicia sesión.");
        } else {
          setError(error.message);
        }
      } else {
        localStorage.setItem("eb_registered", "true");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setError("Email o contraseña incorrectos.");
    }

    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{
        backgroundImage: `url('${import.meta.env.BASE_URL}images/fondo-industria.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-night/85" aria-hidden="true" />

      <div className="relative w-full max-w-sm">
        <Logo />

        <div className="rounded-xl border border-line bg-panel p-6 shadow-lg">

          {step === "code" ? (
            <>
              <h2 className="font-display text-lg text-chalk mb-1">Código de acceso</h2>
              <p className="font-cond text-sm text-mist mb-5">
                Ingresa el código que te dio la empresa para participar.
              </p>
              <form onSubmit={validateCode} className="flex flex-col gap-3">
                <input
                  type="text"
                  required
                  autoFocus
                  autoComplete="off"
                  placeholder="Ingresa el código aquí"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(null); }}
                  className={INPUT_CLS}
                />
                {error && <p className="font-cond text-xs text-card" role="alert">{error}</p>}
                <button type="submit" disabled={!code.trim()} className={BTN_CLS}>
                  Continuar
                </button>
              </form>
              <button
                type="button"
                onClick={() => { setStep("auth"); setMode("login"); setError(null); }}
                className="mt-4 w-full cursor-pointer font-cond text-xs uppercase tracking-widest text-mist hover:text-chalk text-center"
              >
                ¿Ya tienes cuenta? Iniciar sesión →
              </button>
            </>
          ) : (
            <>
              {/* Toggle registro / login */}
              <div className="flex rounded-md border border-line overflow-hidden mb-5">
                <button
                  type="button"
                  onClick={() => { setMode("register"); setError(null); }}
                  className={`flex-1 py-2 font-cond text-sm font-bold uppercase tracking-wider cursor-pointer transition-colors duration-150 ${
                    mode === "register" ? "bg-grass text-night" : "bg-transparent text-mist hover:text-chalk"
                  }`}
                >
                  Registrarse
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(null); }}
                  className={`flex-1 py-2 font-cond text-sm font-bold uppercase tracking-wider cursor-pointer transition-colors duration-150 ${
                    mode === "login" ? "bg-grass text-night" : "bg-transparent text-mist hover:text-chalk"
                  }`}
                >
                  Iniciar sesión
                </button>
              </div>

              <form onSubmit={handleAuth} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="tucorreo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={INPUT_CLS}
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Contraseña (mínimo 6 caracteres)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={INPUT_CLS}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer font-cond text-xs uppercase tracking-wider text-mist hover:text-chalk transition-colors duration-150"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>
                {error && <p className="font-cond text-xs text-card" role="alert">{error}</p>}
                <button type="submit" disabled={loading || !email.trim() || !password} className={BTN_CLS}>
                  {loading
                    ? "Cargando…"
                    : mode === "register"
                    ? "Crear cuenta"
                    : "Entrar"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => { setStep("code"); setCode(""); setError(null); }}
                className="mt-4 w-full cursor-pointer font-cond text-xs uppercase tracking-widest text-mist hover:text-chalk text-center"
              >
                ← Cambiar código
              </button>
            </>
          )}
        </div>

        <p className="mt-4 text-center font-cond text-xs uppercase tracking-widest text-mist">
          11 jun – 19 jul · 48 selecciones · 104 partidos
        </p>

        {/* Badge cliente */}
        <div className="mt-6 flex justify-center">
          <img src={`${import.meta.env.BASE_URL}images/DF-BREWERY.png`} alt="DF Brewery — Automation Specialist" className="h-16 object-contain opacity-60" />
        </div>
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
    const { error } = await db.upsertProfile(user.id, name.trim(), user.email);
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
              className={INPUT_CLS}
            />
            {error && <p className="font-cond text-xs text-card">{error}</p>}
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className={BTN_CLS}
            >
              {loading ? "Guardando…" : "Entrar a la quiniela →"}
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
  const [profile, setProfile] = useState(undefined);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    setChecking(true);
    db.getProfile(user.id).then((p) => {
      if (p && !p.email && user.email) {
        db.upsertProfile(user.id, p.name, user.email);
        setProfile({ ...p, email: user.email });
      } else {
        setProfile(p ?? null);
      }
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
