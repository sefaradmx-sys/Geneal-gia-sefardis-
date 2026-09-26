import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md rounded-xl border border-line bg-panel/90 p-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-brass/40 font-serif text-lg text-brass">
          MV
        </div>
        <h1 className="font-serif text-3xl text-white">LA MV Census</h1>
        <p className="mt-1 text-sm text-mist">Inteligencia de sentimiento cívico</p>
        <LoginForm />
        <p className="mt-8 text-[11px] text-mist">LA MV Census · uso interno</p>
      </section>
    </main>
  );
}
