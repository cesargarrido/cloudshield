"use client";

import { useEffect, useRef, useState } from "react";

interface Service {
  id: string;
  name: string;
  region: string;
  status: "ok" | "warn" | "crit";
  cpu: number[];
  mem: number[];
}

interface Alert {
  id: number;
  sev: "crit" | "warn" | "info";
  title: string;
  detail: string;
  time: string;
}

const BASE_SERVICES: Omit<Service, "cpu" | "mem">[] = [
  { id: "api", name: "api-gateway", region: "us-east-2", status: "ok" },
  { id: "auth", name: "auth-service", region: "us-east-2", status: "ok" },
  { id: "db", name: "postgres-primary", region: "eu-west-1", status: "warn" },
  { id: "cache", name: "redis-cache", region: "eu-west-1", status: "ok" },
  { id: "worker", name: "ml-worker", region: "ap-south-1", status: "crit" },
  { id: "cdn", name: "edge-cdn", region: "global", status: "ok" },
];

function walk(prev: number, base: number): number {
  const next = prev + (Math.random() - 0.5) * base * 0.4;
  return Math.max(2, Math.min(98, next));
}

function sparkPath(values: number[], w: number, h: number): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

const PREDICTIONS: Omit<Alert, "id" | "time">[] = [
  { sev: "crit", title: "Fallo probable en ml-worker", detail: "Riesgo de saturación de memoria en ~12 min (confianza 87%). Escalar nodo recomendado." },
  { sev: "warn", title: "Latencia al alza en postgres-primary", detail: "p99 crece 4% por minuto; posible lock de filas. Confianza 72%." },
  { sev: "info", title: "Tendencia anómala en api-gateway", detail: "Pico de 5xx en us-east-2 sin despliegue reciente. Confianza 64%." },
  { sev: "warn", title: "Rate limiting cercano en auth-service", detail: "Se proyecta superar el límite en ~40 min (p95)." },
];

export default function Dashboard() {
  const [services, setServices] = useState<Service[]>(() =>
    BASE_SERVICES.map((s) => ({
      ...s,
      cpu: Array.from({ length: 30 }, (_, i) => 30 + Math.sin(i / 3 + Math.random()) * 10 + Math.random() * 12),
      mem: Array.from({ length: 30 }, (_, i) => 45 + Math.sin(i / 4) * 8 + Math.random() * 10),
    }))
  );
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [tick, setTick] = useState(0);
  const counter = useRef(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setTick((t) => t + 1);
    }, 2200);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    setServices((prev) =>
      prev.map((s) => {
        const nextCpu = [...s.cpu.slice(1), walk(s.cpu[s.cpu.length - 1], s.status === "crit" ? 60 : 40)];
        const nextMem = [...s.mem.slice(1), walk(s.mem[s.mem.length - 1], 30)];
        return { ...s, cpu: nextCpu, mem: nextMem };
      })
    );
  }, [tick]);

  useEffect(() => {
    if (tick === 0) {
      const seed = PREDICTIONS.map((p, i) => ({
        ...p,
        id: ++counter.current,
        time: clock(),
      })) as Alert[];
      setAlerts(seed);
    } else if (tick % 2 === 0) {
      const p = PREDICTIONS[Math.floor(Math.random() * PREDICTIONS.length)];
      setAlerts((prev) =>
        [{ ...p, id: ++counter.current, time: clock() }, ...prev].slice(0, 12)
      );
    }
  }, [tick]);

  const crits = services.filter((s) => s.status === "crit").length;
  const warns = services.filter((s) => s.status === "warn").length;
  const risk = Math.min(99, Math.round(22 + crits * 18 + warns * 6 + alerts.filter((a) => a.sev === "crit").length * 4));

  return (
    <main className="max-w-7xl mx-auto px-5 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="uppercase tracking-[0.35em] text-xs text-[#2bffb2] font-bold">CloudShield</p>
          <h1 className="text-2xl md:text-3xl font-black mt-1">Vigilancia predictiva de infraestructura</h1>
        </div>
        <div className="flex items-center gap-2 text-xs border border-[#2bffb2]/40 rounded-full px-4 py-2 text-[#2bffb2]">
          <span className="inline-block w-2 h-2 rounded-full bg-[#2bffb2] animate-pulse" />
          EN VIVO · {clock()}
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Uptime" value="99.98%" sub="últimos 90 días" />
        <Stat label="Nodos monitorizados" value={String(BASE_SERVICES.length + 38)} sub="6 críticos activos" accent={crits > 0} />
        <Stat label="Alertas predictivas" value={String(alerts.length)} sub={`${crits} críticas · ${warns} warn`} accent={crits > 0} />
        <Stat label="Riesgo global (ML)" value={`${risk}%`} sub={risk > 60 ? "elevado" : "controlado"} accent={risk > 60} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm uppercase tracking-widest text-[#2bffb2] mb-4">Servicios</h2>
          <div className="space-y-2">
            {services.map((s) => (
              <ServiceRow key={s.id} service={s} />
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm uppercase tracking-widest text-[#2bffb2] mb-4">Predicción ML</h2>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((a) => (
                <div key={a.id} className={`rounded-xl border p-3 text-xs ${sevClass(a.sev)}`}>
                  <div className="flex items-center justify-between gap-2">
                    <b className="uppercase">{a.sev}</b>
                    <span className="opacity-60">{a.time}</span>
                  </div>
                  <p className="mt-1 text-sm">{a.title}</p>
                  <p className="mt-1 opacity-70">{a.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm uppercase tracking-widest text-[#2bffb2] mb-4">Cobertura</h2>
            <ul className="text-sm space-y-2 text-white/80">
              <li>▸ us-east-2 · api · auth</li>
              <li>▸ eu-west-1 · postgres · redis</li>
              <li>▸ ap-south-1 · ml-worker ⚠</li>
              <li>▸ edge · 47 PoPs</li>
            </ul>
          </section>
        </div>
      </div>

      <footer className="mt-10 text-center text-xs text-white/35">
        CloudShield demo · React + Tailwind · arquitectura objetivo: Go · Prometheus · Grafana
      </footer>
    </main>
  );
}

function clock(): string {
  return new Date().toLocaleTimeString("es-CL", { hour12: false });
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] uppercase tracking-wider text-white/45">{label}</p>
      <p className={`text-2xl font-black mt-1 ${accent ? "text-[#ff5d5d]" : "text-[#2bffb2]"}`}>{value}</p>
      <p className="text-[11px] text-white/40 mt-1">{sub}</p>
    </div>
  );
}

function ServiceRow({ service }: { service: Service }) {
  const lastCpu = service.cpu[service.cpu.length - 1];
  const lastMem = service.mem[service.mem.length - 1];
  const color =
    service.status === "ok" ? "#2bffb2" : service.status === "warn" ? "#ffd166" : "#ff5d5d";
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
      <div className="w-40 shrink-0">
        <p className="text-sm font-semibold">{service.name}</p>
        <p className="text-[11px] text-white/40">{service.region}</p>
      </div>
      <Mini title="CPU" values={service.cpu} color={color} last={`${lastCpu.toFixed(0)}%`} />
      <Mini title="MEM" values={service.mem} color="#00d1ff" last={`${lastMem.toFixed(0)}%`} />
      <span
        className="ml-auto text-[11px] uppercase font-bold px-2 py-1 rounded"
        style={{ color, background: `${color}1a` }}
      >
        {service.status}
      </span>
    </div>
  );
}

function Mini({ title, values, color, last }: { title: string; values: number[]; color: string; last: string }) {
  return (
    <div className="flex-1 min-w-[90px]">
      <div className="flex justify-between text-[10px] text-white/45 mb-0.5">
        <span>{title}</span>
        <span style={{ color }}>{last}</span>
      </div>
      <svg viewBox="0 0 120 26" className="w-full h-7">
        <path d={sparkPath(values, 120, 26)} fill="none" stroke={color} strokeWidth={1.6} />
      </svg>
    </div>
  );
}

function sevClass(sev: Alert["sev"]): string {
  if (sev === "crit") return "border-[#ff5d5d]/40 bg-[#ff5d5d]/10 text-red-200";
  if (sev === "warn") return "border-[#ffd166]/40 bg-[#ffd166]/10 text-yellow-100";
  return "border-[#00d1ff]/40 bg-[#00d1ff]/10 text-cyan-100";
}
