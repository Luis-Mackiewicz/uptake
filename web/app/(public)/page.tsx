import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Organize",
    description: "Grupos, conteúdos e notas em uma estrutura simples.",
  },
  {
    title: "Pratique",
    description: "Provas, pomodoro e ciclos no mesmo fluxo.",
  },
  {
    title: "Evolua",
    description: "Ciclos de estudo com próximos passos claros.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-5xl py-12">
      <section className="rounded-3xl bg-white p-10 shadow-panel sm:p-16">
        <h1 className="mt-4 max-w-2xl font-display text-5xl leading-tight tracking-wide text-neutral-900 sm:text-7xl">
          SEU ESTUDO EM UM SÓ LUGAR
        </h1>
        <p className="mt-6 max-w-xl text-base text-neutral-600 sm:text-lg">
          Planeje conteúdos, registre notas em Markdown, acompanhe provas e
          mantenha o ritmo com ciclos e pomodoro.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register">
            <Button size="lg">Começar agora</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              Entrar
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-neutral-200 bg-white p-6 shadow-panel"
          >
            <h2 className="font-display text-2xl tracking-wide text-neutral-900">
              {feature.title}
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              {feature.description}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
