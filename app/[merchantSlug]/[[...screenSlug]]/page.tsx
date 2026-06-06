import { fetchLiveScreen } from "@/lib/api/marketplace";
import { LiveScreenClock } from "@/components/LiveScreenClock";

type PageProps = {
  params: Promise<{ merchantSlug: string; screenSlug?: string[] }>;
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function commodityValue(weight: number, charge: number, spot = 2300) {
  return (spot / 31.1035) * 3.674 * weight * 0.999 + charge;
}

export default async function LiveScreenPage({ params }: PageProps) {
  const { merchantSlug, screenSlug } = await params;
  const data = await fetchLiveScreen(merchantSlug, screenSlug?.[0] || "main");
  const merchant = data.merchant;
  const theme = data.theme;
  const layout = data.layout;
  const commodities = data.commodities || [];
  const news = data.news || [];
  const colors = theme?.customizations?.colors || merchant.branding || {};
  const primary = colors.primary || merchant.branding?.primaryColor || "#d4a017";
  const secondary = colors.secondary || merchant.branding?.secondaryColor || "#0f172a";
  const accent = colors.accent || merchant.branding?.accentColor || "#38bdf8";
  const visible = merchant.visibility || {};

  return (
    <main
      className="min-h-screen overflow-hidden text-white"
      style={{ background: secondary, fontFamily: merchant.branding?.fontFamily || "Inter, sans-serif" }}
    >
      <section className="flex min-h-screen flex-col p-8">
        <header className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            {visible.showCompanyLogo && merchant.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={merchant.logo} alt={merchant.companyName} className="h-16 w-16 rounded object-contain" />
            )}
            <div>
              {visible.showCompanyName && (
                <h1 className="text-5xl font-bold tracking-normal" style={{ color: primary }}>
                  {merchant.companyName}
                </h1>
              )}
              <p className="mt-1 text-lg text-white/70">{layout?.name || "Live Screen"} · {theme?.name || "Aurify Theme"}</p>
            </div>
          </div>
          {visible.showClock && <LiveScreenClock accent={accent} />}
        </header>

        <div className="mt-8 grid flex-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {visible.showSpotRates && (
            <section className="grid gap-5">
              {["GOLD", "SILVER"].map((metal) => (
                <div key={metal} className="rounded-lg border border-white/10 bg-white/5 p-6">
                  <div className="text-xl font-semibold" style={{ color: primary }}>{metal}</div>
                  <div className="mt-5 grid grid-cols-2 gap-5">
                    <div>
                      <div className="text-sm text-white/50">BUY</div>
                      <div className="text-5xl font-bold">{metal === "GOLD" ? "1,234.00" : "34.20"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-white/50">SELL</div>
                      <div className="text-5xl font-bold" style={{ color: accent }}>{metal === "GOLD" ? "1,235.00" : "34.45"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {visible.showCommodities && (
            <section className="rounded-lg border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold" style={{ color: primary }}>Commodity Rates</h2>
              <div className="mt-5 overflow-hidden rounded border border-white/10">
                <div className="grid grid-cols-4 bg-white/10 px-4 py-3 text-sm font-semibold text-white/70">
                  <span>Commodity</span>
                  <span>Unit</span>
                  <span>BUY</span>
                  <span>SELL</span>
                </div>
                {(commodities.length ? commodities : [{ name: "Gold Bar 999", unit: "1 GM", weight: 1, buyCharge: 0, sellCharge: 0 }]).map((item: any) => (
                  <div key={item._id || item.name} className="grid grid-cols-4 border-t border-white/10 px-4 py-4 text-xl">
                    <span>{item.name}</span>
                    <span>{item.weight} {item.unit}</span>
                    <span>{money(commodityValue(item.weight || 1, item.buyCharge || 0))}</span>
                    <span style={{ color: accent }}>{money(commodityValue(item.weight || 1, item.sellCharge || 0, 2305))}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {visible.showNews && (
          <footer className="mt-8 overflow-hidden rounded-lg px-5 py-4 text-2xl font-semibold text-slate-950" style={{ background: primary }}>
            {(news.length ? news : [{ title: "Welcome", content: "Live Aurify screen is ready." }])
              .map((item: any) => `${item.title}: ${item.content}`)
              .join("   •   ")}
          </footer>
        )}
      </section>
    </main>
  );
}
