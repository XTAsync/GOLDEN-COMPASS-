import { createFileRoute, Link } from "@tanstack/react-router";

const TITLE = "Dividend Tracking Guide — Golden Compass";
const DESCRIPTION =
  "Learn how to track dividends from Golden Compass investment pools: how distributions are calculated, when they hit your wallet, and how to monitor yield over time.";

export const Route = createFileRoute("/guides/dividend-tracking")({
  head: () => ({
    meta: [
      { name: "twitter:card", content: "summary" },
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/guides/dividend-tracking" },
    ],
    links: [{ rel: "canonical", href: "/guides/dividend-tracking" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Dividend Tracking Guide",
          description: DESCRIPTION,
          author: { "@type": "Organization", name: "Golden Compass" },
          publisher: { "@type": "Organization", name: "Golden Compass" },
          mainEntityOfPage: "/guides/dividend-tracking",
        }),
      },
    ],
  }),
  component: DividendTrackingGuide,
});

function DividendTrackingGuide() {
  return (
    <article className="page page-narrow enter">
      <header>
        <h1 className="t-title">Dividend Tracking</h1>
        <p className="tx-2 mt-2" style={{ fontSize: 14 }}>
          How distributions from Golden Compass pools reach your wallet — and how to measure the
          yield you're actually earning.
        </p>
      </header>

      <section className="surface-raised rounded-2xl p-5">
        <h2 className="tx-1" style={{ fontSize: 16 }}>
          How dividends work in a pool
        </h2>
        <p className="tx-2 mt-2" style={{ fontSize: 13 }}>
          Each Golden Compass pool holds a basket of income-producing assets. Coupons, interest, and
          dividends collected by the pool are re-priced into the pool's NAV daily. When a
          distribution is declared, your share is credited to your wallet in KES based on the units
          you held on the record date.
        </p>
      </section>

      <section className="surface-raised rounded-2xl p-5">
        <h2 className="tx-1" style={{ fontSize: 16 }}>
          Where to find your dividends
        </h2>
        <ul className="tx-2 mt-2 space-y-2" style={{ fontSize: 13 }}>
          <li>
            <strong className="tx-1">Wallet balance</strong> — distributions land here as a credit
            transaction tagged <em>Dividend</em>.
          </li>
          <li>
            <strong className="tx-1">History</strong> — every distribution appears in your
            transaction log with pool, amount, and date.
          </li>
          <li>
            <strong className="tx-1">Pool NAV</strong> — between distributions, unrealised yield
            shows up as NAV growth on the pool card.
          </li>
        </ul>
      </section>

      <section className="surface-raised rounded-2xl p-5">
        <h2 className="tx-1" style={{ fontSize: 16 }}>
          Measuring real yield
        </h2>
        <p className="tx-2 mt-2" style={{ fontSize: 13 }}>
          To estimate annualised yield, sum the dividends paid into your wallet over the last 12
          months and divide by your average invested principal across that window. Reinvested
          distributions compound — so cash yield will understate total return when NAV is also
          rising.
        </p>
      </section>

      <section className="surface-raised rounded-2xl p-5">
        <h2 className="tx-1" style={{ fontSize: 16 }}>
          Next steps
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          <Link to="/pools" className="btn-primary text-center">
            Explore investment pools
          </Link>
          <Link to="/history" className="tx-2 text-center" style={{ fontSize: 12 }}>
            VIEW YOUR DISTRIBUTION HISTORY →
          </Link>
        </div>
      </section>
    </article>
  );
}
