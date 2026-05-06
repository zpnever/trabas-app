import Link from "next/link";

export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white">
          TB
        </div>
        <div>
          <p className="font-display text-xl">TRABAS</p>
          <p className="font-body text-xs uppercase tracking-[0.24em] text-slate-500">
            Travel Bebas
          </p>
        </div>
      </Link>
      <nav className="font-body hidden gap-6 text-sm text-slate-600 md:flex">
        <a href="#fitur">Fitur</a>
        <a href="#planner">Planner</a>
        <a href="#roadmap">Roadmap</a>
      </nav>
    </header>
  );
}
