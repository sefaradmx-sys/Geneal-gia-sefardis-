import { BellRing, FileBarChart2, Scale, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./login-form";

const FEATURES = [
  { icon: Scale, title: "Índice ponderado", detail: "Engagement, fuente, autor, recencia e ironía." },
  { icon: BellRing, title: "Alertas en 24 horas", detail: "Aviso cuando la negatividad se dispara." },
  { icon: FileBarChart2, title: "Reportes auditables", detail: "PDF y Excel con registro de quién exportó." },
  { icon: ShieldCheck, title: "Recolección legal", detail: "APIs oficiales, RSS y cargas del analista." },
] as const;

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden border-r border-line bg-surface/40 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black_30%,transparent_75%)]" />
        <div className="absolute -left-24 top-24 h-80 w-80 animate-float rounded-full bg-primary/30 blur-[100px]" />
        <div className="absolute bottom-10 right-0 h-72 w-72 animate-float rounded-full bg-accent/20 blur-[100px] [animation-delay:-4s]" />

        <div className="relative">
          <Logo />
        </div>

        <div className="relative max-w-xl">
          <p className="eyebrow">Plataforma privada</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-fg">
            Lo que la conversación pública <span className="text-gradient">dice hoy</span>, medido con método.
          </h1>
          <p className="mt-4 text-base text-muted">Sentimiento digital por perfil, gobierno y tema, con tendencia, alertas y las menciones que sostienen cada número.</p>

          <div className="card mt-8 p-5">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Índice de favorabilidad · 30 días</span>
              <span className="chip border-pos/25 bg-pos/10 text-pos">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pos" />
                En vivo
              </span>
            </div>
            <svg viewBox="0 0 400 110" className="mt-3 h-28 w-full" aria-hidden>
              <defs>
                <linearGradient id="login-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c5cff" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#7c5cff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="55" x2="400" y2="55" stroke="#1d2539" strokeDasharray="4 4" />
              <path d="M0 60 C 40 40, 70 45, 100 38 S 160 50, 200 42 S 260 30, 290 48 S 350 85, 400 80 L 400 110 L 0 110 Z" fill="url(#login-area)" />
              <path
                d="M0 60 C 40 40, 70 45, 100 38 S 160 50, 200 42 S 260 30, 290 48 S 350 85, 400 80"
                fill="none"
                stroke="#7c5cff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="1000"
                className="animate-dash"
              />
              <circle cx="400" cy="80" r="5" fill="#fb7185" className="animate-pulse" />
            </svg>
          </div>
        </div>

        <ul className="relative grid max-w-xl grid-cols-2 gap-4">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-elevated/70 text-primary">
                <feature.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-fg">{feature.title}</p>
                <p className="text-xs text-muted">{feature.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="relative flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-fg">Bienvenido</h2>
          <p className="mt-2 text-sm text-muted">Entra con tu usuario de la organización.</p>
          <LoginForm />
          <p className="mt-10 text-center text-[11px] text-muted">
            LA MV Census · uso interno
            <br />
            Sentimiento digital observado. No es encuesta representativa.
          </p>
        </div>
      </section>
    </main>
  );
}
