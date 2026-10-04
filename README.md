<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1U8Ime9w74dgmH0kgbWERCO1i3XNco1v3

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and supply the public Supabase anon key.
   The configured local checkout already has these values in its ignored `.env.local`.
3. Run the app:
   `npm run dev`

## Supabase

This app uses the **blow me away** project (`ekxeaqbbnnprllwarcpe`, US West).
[Open the dashboard](https://supabase.com/dashboard/project/ekxeaqbbnnprllwarcpe).

The restored project retains its catalog, image bucket, and existing administrator
account. The migrations include the original catalog setup, the recovered
`20260412000000_scent_product_split` migration, and realtime candle updates.
The current app still reads `candles`; the existing `scents` and `products` tables
are preserved. The original catalog includes example images and prices; review it
in `/admin` before using it for sales.

To apply future migrations from another checkout:

```sh
supabase login
supabase link --project-ref ekxeaqbbnnprllwarcpe
supabase db push
```

Public visitors can read the catalog and images. Signed-in users can manage them,
so public signup is disabled. Create only trusted administrator accounts through
Supabase Authentication > Users > Add user, then sign in at `/admin/login`.
Never enable public signup without first adding explicit admin authorization.

Keep service-role keys and database passwords out of all `VITE_` variables and
source control.

## Vercel deployment

Production: [blow-me-away-candles.vercel.app](https://blow-me-away-candles.vercel.app).
Admin: [Sign in](https://blow-me-away-candles.vercel.app/admin/login).

The Vercel project is `blas-projects-3e12d96d/blow-me-away-candles`.
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured for production,
preview, and development. Supabase's site URL and auth redirect allowlist include
the production domain. The local `.vercel` link is ignored by Git, and
`.vercelignore` excludes environment files and database tooling from uploads.

Pushes to `main` deploy automatically through the connected Vercel Git integration.
Apply database migrations and configure any new server settings before pushing.
To publish manually when needed:

```sh
vercel link --yes --project blow-me-away-candles --scope blas-projects-3e12d96d
vercel deploy --prod --scope blas-projects-3e12d96d
```

The old GitHub Actions deployment workflow has been removed; Vercel handles the
GitHub integration directly.

Validation: `npx tsc --noEmit` and `npm run build`.

## Cart, checkout, and USPS shipping

### Candle availability

Each candle has a nonnegative whole-number `stock` count. Edit **Available candles**
in `/admin/candles/:id`; the admin list also shows the count. Zero means sold out.
Product cards switch from **Add to Cart** to a minus/quantity/plus selector after
adding a candle. Reducing a card's quantity to zero returns the Add to Cart button.
The cards and cart share the same quantities and enforce both stock and the existing
24-candle order limit. Saved carts adjust to lower stock with a notice, and catalog
updates refresh through realtime and when returning to the tab. Checkout checks
current database stock again for both shipping quotes and order submissions.

Before deploying this feature, apply
`supabase/migrations/20261004000000_candle_stock.sql`. Existing candles start with
one available unit, and newly created candles also default to one. Counts can be
changed in admin, including setting zero for sold out. The historical
`products.stock` seed values are not used. Missing stock is treated as unavailable.
Apply the migration before deploying the app; admin stock saves require the
migration on the database the app is connected to.

Stock is an administrator-maintained availability cap. As checkout currently saves
unpaid orders, saving an order does not reserve or deduct inventory. Atomic stock
reservation/deduction should be added with payment before accepting paid sales.

### Checkout behavior

The cart is stored in this browser's local storage and stays in sync across tabs.
Checkout collects a full name, email, and U.S. shipping address, then offers USPS
Ground Advantage and Priority Mail when available. The selected postage is added
to the item subtotal. Checkout saves an **unpaid order** (`pending_payment`), clears
the purchased items from the cart, and shows a receipt. No payment is collected,
shipping label purchased, email sent, inventory reserved, or shipment scheduled.
Taxes are not calculated; displayed totals are estimates until payment is added.

### Local setup

`npm run dev` serves both the storefront and `/api/checkout` through Vite. No second
server is needed. `npm run preview` also includes the local checkout endpoint.

The shipping settings in `.env.example` (also configured in this checkout's
`.env.local`) are the initial values requested for this store:

```dotenv
USPS_ORIGIN_ZIP=60622
USPS_PACKAGE_WEIGHT_LB=4
USPS_PACKAGE_LENGTH_IN=12
USPS_PACKAGE_WIDTH_IN=12
USPS_PACKAGE_HEIGHT_IN=12
```

**Packing assumption:** each candle ships in its own 12 × 12 × 12-inch box with a
gross packed weight of 4 lb. Shipping for three candles is three package rates,
including for three of the same candle. Change the measurements and weight after
measuring the actual packed product. Consolidating candles into shared boxes
requires updating the packing logic in `server/usps.ts` and `server/checkout.ts`.

To enable live rates (checked against USPS's official guide on October 4, 2026):

1. Follow the [USPS getting-started guide](https://developers.usps.com/getting-started):
   log in or create a USPS Business account through the
   [Customer Onboarding Portal (COP)](https://cop.usps.com), then finish account setup.
2. In COP, use **My Apps** to create/select the store's app. In its **Credentials**
   section, retrieve the **Consumer Key** and **Consumer Secret**. Domestic Pricing
   is listed in USPS's default API product; the app must have the `domestic-prices` scope.
3. Set `USPS_CLIENT_ID` to the Consumer Key and `USPS_CLIENT_SECRET` to the Consumer
   Secret in `.env.local`. These are app credentials, not your USPS login or an
   old Web Tools user ID. Never prefix either with `VITE_` or commit the values.
4. Keep `USPS_ENVIRONMENT=production` for live rates. For USPS's Testing Environment
   for Mailers (TEM), set it to `test`; USPS says to use the **same production
   credentials** with the `apis-tem.usps.com` host.
5. Run `npm run usps:check -- 90210 --quantity 2` to test authentication and prices
   from Chicago to a sample destination. The command prints per-package and total
   shipping amounts without creating an order, buying postage, or logging secrets.
6. Restart `npm run dev` after changing environment settings, then calculate
   shipping in checkout with the customer's actual destination ZIP code.

For a check without credentials or any network request:

```sh
npm run usps:check -- 90210 --quantity 2 --dry-run
```

This prints the exact non-secret payload used by checkout and names missing
credential fields. A dry run does **not** confirm USPS authentication or prices.
For deployment, configure the same server-only values in Vercel as well.

The integration uses [USPS OAuth v3](https://developers.usps.com/Oauth) and
[Domestic Prices v3](https://developers.usps.com/domesticpricesv3), specifically
`POST /prices/v3/total-rates/search`. It requests retail rates for the configured
box and excludes flat-rate packaging and destination-entry discounts. OAuth uses
`client_credentials` with scope `domestic-prices` (verified against the live API;
`prices` is the URL path, not a valid OAuth scope). The price request uses `mailClasses`
for Ground Advantage and Priority Mail, weight in pounds, dimensions in inches,
and `extraServices: [920]` (USPS Tracking), as recommended in the current schema
for these services. This avoids requesting every optional extra service. The
returned `totalPrice` is used when present; otherwise `totalBasePrice` already
includes applicable base fees. Fees must not be added a second time.

The flow is: customer's ZIP → our server → OAuth token → USPS price request →
eligible service prices → selected shipping added to the cart subtotal. Tokens are
cached until expiry and rates for five minutes. A missing credential, unavailable
service, or failed request shows an actionable error and prevents order submission;
there are no invented or zero-dollar fallback shipping rates. USPS receives ZIP
codes and package dimensions/weight, not the customer's name, email, or street
address. Address format is checked, but USPS address validation is not included.

The API reports **retail** postage, matching the current store configuration.
Commercial or contract rates should only be introduced when the store's postage
purchasing method supports those rates. Package measurements affect both actual
and dimensional weight, so replace the temporary 12-inch/4-lb values before sales.
The app's API quota is set by its USPS API product; check that product rather than
assuming a universal quota. Quota increases go through
[USPS API Support](https://emailus.usps.com/s/usps-APIs).

Connection-check errors distinguish `USPS_AUTH` (OAuth request rejected),
`USPS_ACCESS_DENIED` (pricing access missing), `USPS_RATE_REQUEST` (shipment request
rejected), and `USPS_BUSY` (quota exceeded). Only a 401 on the price request triggers
one token refresh. Invalid credentials and permission errors are not retried.
USPS's separate label-purchasing enrollment and payment-account flow is not used
by this rate-only integration.

Prices are fetched from the catalog on the server. Signed quotes bind the price,
cart, and delivery details for 15 minutes; changes require recalculating shipping.
Idempotency keys prevent duplicate orders when a request is retried. Checkout
progress and the last receipt are kept only in the current browser tab's session.

Local orders are private JSON files in `.local-orders/`, ignored by Git and Vercel
and blocked from HTTP access. They survive a server restart. Treat that directory
as customer data; it contains delivery details. Local checkout does not write to
the production database. A generated `CHECKOUT_SIGNING_SECRET` in `.env.local`
keeps quotes valid across local restarts.

### Checkout deployment

Local files are not durable on Vercel. Before deploying checkout, apply
`supabase/migrations/20260927020000_checkout_orders.sql` and configure
`SUPABASE_SERVICE_ROLE_KEY` and a random `CHECKOUT_SIGNING_SECRET` of at least 32
characters on the server, along with the USPS settings and existing public
Supabase configuration. The `/api/checkout` serverless endpoint then saves orders
in `checkout_orders`; browser roles have no access to customer order data.
Apply migrations with `supabase db push` before publishing the app. Payment
integration is not included. Live shipping quotes also require `USPS_CLIENT_ID`
and `USPS_CLIENT_SECRET`; without them, the cart remains usable but checkout
cannot calculate shipping or save an order.

### Verification

Use Node.js 22.18+ (or 24+) for the TypeScript tests:

```sh
npm test
npm run typecheck
npm run build
```

Tests cover USPS request/response handling, credentials and outages, eligible
rate selection, quantity-based shipping, price tampering, invalid addresses,
quote expiry, duplicate submissions, and persistent order storage. They use
stubbed USPS responses; live USPS authentication must be verified with your keys.
