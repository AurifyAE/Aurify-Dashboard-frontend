import { fetchLiveScreen } from "@/lib/api/marketplace";
import DipanjaliLayout from "@/components/live-screen/ScreenLayout";

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

  if (
    merchantSlug === "favicon.ico" ||
    merchantSlug === "favicon.svg" ||
    merchantSlug === "images" ||
    merchantSlug.startsWith("_next")
  ) {
    return null;
  }

  let data;
  try {
    data = await fetchLiveScreen(merchantSlug, screenSlug?.[0] || "main");
  } catch (err) {
    return (
      <main className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="max-w-md space-y-5 rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm shadow-xl">
          <div className="h-14 w-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/25">
            <span className="text-xl font-bold">!</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold">Live Screen Unavailable</h1>
            <p className="text-slate-400 text-xs leading-relaxed">
              {err instanceof Error ? err.message : "The requested showroom TV screen or merchant profile is not active yet."}
            </p>
          </div>
          <div className="pt-2">
            <a href="/dashboard" className="inline-block px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-bold text-xs text-white shadow-sm hover:from-amber-600 hover:to-orange-600 transition-all">
              Return to Dashboard
            </a>
          </div>
        </div>
      </main>
    );
  }

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
    <DipanjaliLayout data={data} />
  );
}
