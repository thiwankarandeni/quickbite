# Learning guide

Read the code in this order. Each step lists the concepts and the files where you'll find them.
The code has `CONCEPT:` comments at the important spots. Search for `CONCEPT` to jump between them.

Tip: keep the app running while you read. Change something small, save, and see what happens.

---

## Step 1: MongoDB: how data is stored

Start in the backend because everything else depends on the data's shape.

| Concept | Where |
| --- | --- |
| Client, database, collection, document, `_id` | [backend/app/db.py](backend/app/db.py) |
| Indexes (unique, compound) | `create_indexes` in [db.py](backend/app/db.py) |
| **Embedding vs referencing** (the key modelling decision) | top of [models/order.py](backend/app/models/order.py) |
| `find` + filter + `sort`, `$regex`, `$in` | [routers/menu.py](backend/app/routers/menu.py), [routers/orders.py](backend/app/routers/orders.py) |
| `insert_one`, `find_one_and_update` + `$set`, `delete_one` | [routers/menu.py](backend/app/routers/menu.py) |
| `$push` onto an array | `update_order_status` in [routers/admin.py](backend/app/routers/admin.py) |
| **Aggregation pipeline** (`$match`, `$unwind`, `$group`, `$project`) | `stats` in [routers/admin.py](backend/app/routers/admin.py) |
| Upsert, bulk insert | [backend/seed.py](backend/seed.py) |

**Look at real data:** in Atlas, open *Browse Collections* (or install **MongoDB Compass**) and look at an
`orders` document. Notice the `items` array and `status_history`.

## Step 2: FastAPI: the HTTP API

| Concept | Where |
| --- | --- |
| App, routers, CORS, lifespan (startup/shutdown) | [backend/app/main.py](backend/app/main.py) |
| Settings from env vars (pydantic-settings) | [backend/app/config.py](backend/app/config.py) |
| Pydantic models: validation, Create/Update/Out pattern | [backend/app/models/](backend/app/models/) |
| Path params, query params, request body, `response_model`, status codes | [routers/menu.py](backend/app/routers/menu.py) |
| `HTTPException` (400/401/403/404/409) | all routers |
| **Dependency injection** (`Depends`) and dependency chains | [backend/app/deps.py](backend/app/deps.py) |
| Router-wide dependency (protect every admin route) | top of [routers/admin.py](backend/app/routers/admin.py) |
| Password hashing, JWT create/verify | [backend/app/security.py](backend/app/security.py) |
| OAuth2 password flow (form login) | `login` in [routers/auth.py](backend/app/routers/auth.py) |

**Try it:** open <http://localhost:8000/docs>, call `POST /orders` without authorizing (→ 401), then
authorize and call it again. Send `quantity: 0` and read the 422 validation error.

## Step 3: React: components, props and state

| Concept | Where |
| --- | --- |
| Components and props | [components/MenuItemCard.tsx](frontend/src/components/MenuItemCard.tsx), [OrderStatusBadge.tsx](frontend/src/components/OrderStatusBadge.tsx) |
| List rendering with `key`, conditional rendering | [components/MenuGrid.tsx](frontend/src/components/MenuGrid.tsx) |
| `useState`, event handlers | [components/AddToCartButton.tsx](frontend/src/components/AddToCartButton.tsx) |
| **`useReducer` + Context + custom hook** | [context/CartContext.tsx](frontend/src/context/CartContext.tsx) |
| `useEffect` (localStorage sync, hydration) | [context/CartContext.tsx](frontend/src/context/CartContext.tsx) |
| `useMemo`, `useRef` | [CartContext.tsx](frontend/src/context/CartContext.tsx), [checkout/CheckoutForm.tsx](frontend/src/app/checkout/CheckoutForm.tsx) |
| Controlled vs uncontrolled inputs | [checkout/CheckoutForm.tsx](frontend/src/app/checkout/CheckoutForm.tsx) |
| `useActionState`, `useFormStatus`, `useTransition` | [components/AuthForm.tsx](frontend/src/components/AuthForm.tsx), [SubmitButton.tsx](frontend/src/components/SubmitButton.tsx), [orders/[id]/RefreshButton.tsx](frontend/src/app/orders/[id]/RefreshButton.tsx) |

## Step 4: Next.js: routing, rendering and data

| Concept | Where |
| --- | --- |
| File-based routing: folders = URLs | [frontend/src/app/](frontend/src/app/) |
| Root layout and nested layout | [app/layout.tsx](frontend/src/app/layout.tsx), [app/admin/layout.tsx](frontend/src/app/admin/layout.tsx) |
| Dynamic routes `[id]`, `params` | [app/menu/[id]/page.tsx](frontend/src/app/menu/[id]/page.tsx) |
| `searchParams` (URL as state) | [app/menu/page.tsx](frontend/src/app/menu/page.tsx), [components/CategoryFilter.tsx](frontend/src/components/CategoryFilter.tsx) |
| **Server vs Client Components** (`"use client"`) | compare [MenuItemCard.tsx](frontend/src/components/MenuItemCard.tsx) with [AddToCartButton.tsx](frontend/src/components/AddToCartButton.tsx) |
| Async Server Components fetching data | [app/page.tsx](frontend/src/app/page.tsx), [lib/data.ts](frontend/src/lib/data.ts) |
| **`<Suspense>` + streaming, Cache Components** | every page; see comment in [next.config.ts](frontend/next.config.ts) |
| **Server Actions** (forms that run server code) | [app/actions/](frontend/src/app/actions/) |
| `.bind()` to pass extra args to an action | [app/admin/menu/page.tsx](frontend/src/app/admin/menu/page.tsx) |
| `revalidatePath`, `redirect`, `notFound` | [app/actions/admin.ts](frontend/src/app/actions/admin.ts), [app/menu/[id]/page.tsx](frontend/src/app/menu/[id]/page.tsx) |
| `error.tsx`, `not-found.tsx` | [app/error.tsx](frontend/src/app/error.tsx), [app/not-found.tsx](frontend/src/app/not-found.tsx) |
| `next/image`, `next/link`, `next/font`, metadata | [MenuItemCard.tsx](frontend/src/components/MenuItemCard.tsx), [layout.tsx](frontend/src/app/layout.tsx) |
| Proxy (formerly "middleware") | [frontend/src/proxy.ts](frontend/src/proxy.ts) |

> ⚠️ Next.js 16 changed a lot: `middleware.ts` became `proxy.ts`, `params`/`searchParams` are Promises,
> and Cache Components require `<Suspense>` around request-time data. Older tutorials may not match.
> The up-to-date docs ship inside the project: `frontend/node_modules/next/dist/docs/`.

## Step 5: Authentication end to end

Follow a login through every layer:

1. [components/AuthForm.tsx](frontend/src/components/AuthForm.tsx): the form submits to `loginAction`
2. [app/actions/auth.ts](frontend/src/app/actions/auth.ts): posts the credentials to FastAPI
3. [backend/app/routers/auth.py](backend/app/routers/auth.py): checks the password hash and returns a JWT
4. [lib/session.ts](frontend/src/lib/session.ts): stores the JWT in an **httpOnly cookie**
5. On later requests: [lib/session.ts](frontend/src/lib/session.ts) `getCurrentUser()` → `GET /auth/me` → [deps.py](backend/app/deps.py) `get_current_user`

Notice the **three layers of protection**: `proxy.ts` (only checks that a cookie exists),
`requireUser`/`requireAdmin` in Next.js, and finally `Depends(get_current_user)`/`require_admin` in FastAPI,
which is the one that really matters.

## Step 6: Trace one request: "Place order"

[CheckoutForm.tsx](frontend/src/app/checkout/CheckoutForm.tsx) (form submit) → [actions/orders.ts](frontend/src/app/actions/orders.ts)
(`placeOrderAction`, re-checks auth) → [lib/api.ts](frontend/src/lib/api.ts) (`POST /orders` + Bearer token) →
[routers/orders.py](backend/app/routers/orders.py) (`$in` lookup, server-side total, `insert_one`) → back to the action
(`revalidatePath`) → `CheckoutForm` `useEffect` clears the cart and navigates → [orders/[id]/page.tsx](frontend/src/app/orders/[id]/page.tsx).

Why does the server recompute the total? Open DevTools and change a price in the cart's localStorage,
then check out. The order still has the correct price.

## Step 7: Testing the backend

The tests in [backend/tests/](backend/tests/) double as **executable documentation**: each test name states a rule
the API guarantees ("customer cannot see someone else's order", "order keeps old price after menu change").

| Concept | Where |
| --- | --- |
| Fixtures, `yield` teardown, scopes, fixture factories | [tests/conftest.py](backend/tests/conftest.py) |
| Unit tests (no HTTP, no DB) | [tests/test_security.py](backend/tests/test_security.py) |
| API tests with `TestClient`, Arrange / Act / Assert | [tests/test_auth.py](backend/tests/test_auth.py), [tests/test_menu.py](backend/tests/test_menu.py) |
| `@pytest.mark.parametrize` (one test, many cases) | [tests/test_auth.py](backend/tests/test_auth.py), [tests/test_admin.py](backend/tests/test_admin.py) |
| Testing security rules (401 vs 403 vs 404) | [tests/test_orders.py](backend/tests/test_orders.py), [tests/test_admin.py](backend/tests/test_admin.py) |
| Checking the database directly, not just the response | `sync_db` usage in [tests/test_orders.py](backend/tests/test_orders.py) |

**Try it: prove the tests work.** Break something on purpose, e.g. in [routers/orders.py](backend/app/routers/orders.py)
change `total += menu_item["price"] * line.quantity` to `total += menu_item["price"]`, run `pytest`, and watch which
tests fail and why. Then undo it (`git restore backend/app/routers/orders.py`).

---

## Exercises (roughly easiest → hardest)

1. **Add a field:** give menu items a `spicy: bool`. Update the Pydantic models, the TS type, the admin form, and show a 🌶️ badge.
2. **Search box:** the API already supports `GET /menu?search=...`. Add a search input to `/menu` that puts `?search=` in the URL.
3. **Customer cancel:** let customers cancel their own order while it's `pending` (new endpoint + Server Action + button).
4. **Auto-refresh:** make the order page poll every 10s (`setInterval` in `useEffect` calling `router.refresh()`; remember the cleanup function).
5. **Pagination:** add `skip`/`limit` query params to `GET /admin/orders` and Next/Prev links.
6. **Caching:** wrap `getMenu` in `"use cache"` with `cacheTag("menu")` and call `updateTag("menu")` from the admin actions. (Note: then `next build` needs the API running.)
7. **Ratings:** add a `reviews` collection. Should reviews be embedded in menu items or referenced? Why?
8. **Tests first:** pick exercise 1 or 3 and write the test *before* the code. Watch it fail, then make it pass (this is TDD).
