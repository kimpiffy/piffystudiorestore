<h1 align="center">Piffy Studio</h1>

<p align="center">
  <img src="static/img/logo.webp" alt="Piffy Studio logo" width="180">
</p>

Piffy Studio is a Django-powered portfolio and creative studio website for Kim Piffy. It brings together art, digital and community work, a contact and newsletter flow, and a product shop. Django provides the server-rendered pages, forms, data models and staff tools; custom CSS and JavaScript provide the site's responsive visual identity and interactive portfolio experiences.

The application includes Stripe Checkout and optional Cloudinary/OpenAI integrations. These require correctly configured credentials and external service testing; their presence in the code does not establish that a live transaction or third-party integration has been verified.

> **Assessment evidence note:** This README describes capabilities found in the repository. It does not claim that every feature, device layout or external integration has passed manual or live testing. See [TESTING.md](TESTING.md) for the current automated test result and evidence gaps, and [BUGLOG.md](BUGLOG.md) for reconstructed development history.

<!-- TODO: Add a current, Piffy Studio screenshot after capturing and approving a representative desktop and mobile view. Do not copy screenshots from another project. -->

### Table of Contents

<details><summary><strong>Project overview</strong></summary>

- Purpose and users
- Project-derived user journeys
- Visual design and accessibility
</details>

<details><summary><strong>Features</strong></summary>

- Shared site shell
- Public pages and portfolio
- Contact and newsletter
- Shop and payments
- Staff dashboard
- Creative prompt endpoint
</details>

<details><summary><strong>Technical architecture</strong></summary>

- Django apps
- Data model and relationships
- Static files and media
- External services
- Known issues and current limitations
- Future development
</details>

<details><summary><strong>Development setup</strong></summary>

- Requirements
- Installation
- Environment configuration
- Run locally
- Seed the shop
</details>

<details><summary><strong>Testing and assessment evidence</strong></summary>

- Automated testing
- Manual testing
- TDD, user stories and design evidence
</details>

<details><summary><strong>Deployment</strong></summary>

- Render configuration
- Production considerations
</details>

<details><summary><strong>Credits, licensing and contact</strong></summary></details>

---

## Project overview

### Purpose

The site presents a multidisciplinary creative practice and provides visitors with a direct route to explore work, make contact and browse the shop. Staff-facing Django views support management of shop products, orders, contact messages and newsletter subscriber data.

### Users and project-derived journeys

The following are journeys inferred from the current product and routes. They are **not a recovered, approved user-story specification**.

| User | Project-derived journey |
|---|---|
| Portfolio visitor | Explore About, Art, Digital and Community pages; open project details and view associated media. |
| Potential client or collaborator | Review the studio's work and submit a categorized contact message. |
| Newsletter subscriber | Opt in through the contact form; the address is stored for staff review/export. |
| Shop customer | Browse products, view a product, manage a cart and continue to Stripe Checkout when payment configuration is available. |
| Staff member | Sign in to manage products and images, view orders and review contact/newsletter records. |

**TODO:** Confirm these journeys with the project owner/assessment brief, then add approved user stories and acceptance criteria.

### Visual design and accessibility

The site uses a custom visual identity, expressive typography, animated/blob-inspired portfolio layouts and responsive CSS. The shared templates include a primary navigation landmark, a main-content region and labelled controls in several interactive views. The source also contains mobile-specific layout and interaction logic.

These are implementation details, not an accessibility or responsive pass result. **TODO:** document the approved wireframes, full colour/typography palette, contrast checks, keyboard/screen-reader review and device/browser evidence in [TESTING.md](TESTING.md).

## Features

### Shared site shell

- Shared base template with page title/SEO metadata, navigation, footer and a loading indicator.
- Navigation links to About, Art, Digital, Community, Shop and Contact.
- Bootstrap 5.3.3 and Font Awesome are loaded by the shared template.
- Django static-file handling and WhiteNoise support production static assets.

### Public pages and portfolio

| Page | Route | Current purpose |
|---|---|---|
| Home | `/` | Studio landing page and animated navigation/intro. |
| About | `/about/` | Studio biography and About-page interactions. |
| Contact | `/contact/` | Contact form and optional newsletter opt-in. |
| Art | `/work/art/` | Art portfolio and project details. |
| Digital | `/work/digital/` | Digital work portfolio and project interactions. |
| Community | `/work/people/` | Community/creative-health work and project details. |
| Styles | `/work/styles/` | Responsive publication/studio-style presentation. |
| Industry | `/work/industry/` | Brand-guidelines/document viewer. |

Named routes are maintained in `pages/urls.py` and `portfolio/urls.py`. Community project detail routes are registered at `/community/<slug>/`.

### Contact and newsletter

- Contact data is validated with a Django `ModelForm`; categories include art, web design, community projects, creative facilitation, collaboration and other.
- The form has a honeypot field and requires a further description when “other” is selected.
- Contact messages and newsletter subscribers are stored in the database; an opted-in contact is associated with a subscriber record.
- Staff tools provide message review, read/replied state, notes, deletion, subscriber review, deletion and CSV export.

**Limit:** The code stores and exports newsletter addresses; a third-party newsletter delivery service is not configured in the application flow.

### Shop and payments

- Product listing and product detail pages, category and variant data, product images/galleries and anonymous product likes.
- Cart operations include add, update and remove; the server also supports session-based cart data.
- Stripe Checkout session creation, webhook handling, cancellation and thank-you routes are present. Payment completion requires correct Stripe settings and webhook configuration.
- Staff-only shop management includes product/category management, product duplication, bulk deletion, image upload/delete/reordering and order review. Variant endpoints exist, but variant management and variant checkout behavior are currently incomplete; see [Known issues and current limitations](#known-issues-and-current-limitations).
- `seed_shop` loads catalogue records and associated images; Render behavior preserves images for existing products.

**Limit:** Stripe sandbox/live transactions and webhook delivery have not been independently evidenced in the historical record. See [TESTING.md](TESTING.md) before relying on payment behavior.

### Staff dashboard

Authenticated routes under `/accounts/` include a dashboard, contact-message and newsletter tools. The shop-management routes are under `/shop/manage/`. Management views use staff checks; login/logout use Django authentication views and a custom login form. There is no self-service account-registration flow in the current routes.

### Creative prompt endpoint

`/interactions/prompt/` exposes a GET endpoint for the footer's creative prompt feature. The implementation uses an OpenAI integration when configured and includes a local fallback. Historical development commits report an API-generation issue; successful external API operation is not established by that history.

## Technical architecture

### Applications

| Django app | Responsibility |
|---|---|
| `pages` | Home, About, Contact, contact/newsletter models, SEO metadata, sitemap and robots support. |
| `portfolio` | Art, Digital, Community, Styles and Industry portfolio views and project data. |
| `shop` | Catalogue, cart, orders, product media, likes, Stripe integration and staff shop management. |
| `accounts` | Login/logout, dashboard, contact-message and newsletter administration. |
| `interactions` | Creative-prompt API endpoint and generation/fallback logic. |
| `config` | Django settings, root URL configuration and WSGI/ASGI entry points. |

### Data model

The database schema is defined in Django models and migrations. The principal relationships include:

| Model group | Relationship and purpose |
|---|---|
| `Category` → `Product` | A category has products; a product belongs to a category. |
| `Product` → `ProductImage` | A product can have ordered gallery images. |
| `Product` → `ProductVariant` | A product can have named variants with stock and price adjustments. |
| `Cart` → `CartItem` | A cart contains product/quantity rows. Session cart behavior also exists in the shop views. |
| `Order` → `OrderItem` | An order stores payment/shipping details and its product/quantity rows. |
| `Product` → `ProductLike` | Anonymous likes are associated with a product and unique anonymous token. |
| `NewsletterSubscriber` → `ContactMessage` | A contact message may refer to a subscriber who opted in. |

The `pages` app defines the custom `ContactMessage` and `NewsletterSubscriber` models; the `shop` app defines the product, cart, order and like models.

### Detailed model field tables

These are documentation placeholders, not a substitute for checking each field against the current model source. Complete the tables from `pages/models.py` and `shop/models.py`, including every field, Django field type, options/defaults, validators, relationship, deletion behavior, constraint and design rationale.

| Model | Field | Django type and options | Relationship / constraint / delete behavior | Purpose and design rationale |
|---|---|---|---|---|
| `pages.NewsletterSubscriber` | TODO: enumerate fields | TODO | TODO | TODO |
| `pages.ContactMessage` | TODO: enumerate fields | TODO | TODO | TODO |
| `shop.Category` | TODO: enumerate fields | TODO | TODO | TODO |
| `shop.Product` | TODO: enumerate fields | TODO | TODO | TODO |
| `shop.ProductImage` | TODO: enumerate fields | TODO | TODO | TODO |
| `shop.ProductVariant` | TODO: enumerate fields | TODO | TODO | TODO |
| `shop.Cart` | TODO: enumerate fields | TODO | TODO | TODO |
| `shop.CartItem` | TODO: enumerate fields | TODO | TODO | TODO |
| `shop.Order` | TODO: enumerate fields | TODO | TODO | TODO |
| `shop.OrderItem` | TODO: enumerate fields | TODO | TODO | TODO |
| `shop.ProductLike` | TODO: enumerate fields | TODO | TODO | TODO |

### Entity-relationship diagram (ERD)

> **TODO — ERD not yet supplied:** Add a reviewed diagram of the custom models and their cardinalities, including the product, category, image, variant, cart, order, contact-message and subscriber relationships. Add a brief note describing normalization and any deliberate denormalization.

<!-- TODO: Replace this note with a Mermaid ER diagram or an accessible, repository-hosted ERD image after the model relationships have been verified. -->

### Static files and uploaded media

- Source CSS, JavaScript, fonts, images, video and publication assets are in `static/`.
- User-uploaded product media is stored under `media/` locally. When Cloudinary configuration is present, the custom shop storage backend is selected.
- In production, WhiteNoise serves collected static assets from `STATIC_ROOT`.
- The build script runs the media optimizer, installs Python requirements, applies migrations, seeds the shop and collects static assets.

### External services

| Service | Use in application | Configuration |
|---|---|---|
| Render | Web service and PostgreSQL deployment declared in `render.yaml`. | Render environment and database settings. |
| Stripe | Hosted checkout and payment webhook. | Stripe secret and webhook settings; configure test/live credentials deliberately. |
| Cloudinary | Optional remote product media storage. | Cloudinary URL or cloud name/API key/API secret. |
| OpenAI | Optional footer creative-prompt generation. | OpenAI API key and optional prompt model setting. |
| Gmail SMTP | Django email backend configuration for order email. | Email user and password settings. Delivery must be tested separately. |

## Known issues and current limitations

These items come from the code and the read-only Gateway Qualifications assessment audit. They are documented findings, not claims that a fix has been made. Recheck each item after changes and link its test ID/evidence from [TESTING.md](TESTING.md).

### Functional and payment limitations

- **Product variants are incomplete:** variant routes are present, but the views refer to add/edit template names that are not in the repository (the available template is `shop/templates/shop/manage/variant_form.html`). Product detail variant selection is not connected to the add-to-cart submission; variant pricing/stock is not carried through the cart and checkout.
- **Guest payment order creation is at risk:** the guest checkout path can reach webhook order creation without an authenticated user, while `Order.user` is a required foreign key. Successful guest payments may therefore fail to create an order.
- **Webhook idempotency is not implemented:** repeated Stripe event delivery may create duplicate orders; the successful payment/webhook path has not been integration-tested.
- **Cart validation is incomplete:** user-provided quantities and cart edge cases do not have comprehensive defensive validation or automated coverage.
- **Mutation methods need review:** some destructive shop management actions are not consistently restricted to POST; test and secure each state-changing route.
- **Checkout validation is incomplete:** the checkout form contains placeholder validation logic; verify the data passed to Stripe and the resulting transaction feedback.
- **Account registration is absent:** users can log in/out, but there is no self-service registration workflow or anonymous-only restriction for authentication pages.
- **Email delivery is unverified:** SMTP/order-email code exists, but no current delivery test is recorded; the historical log notes an unresolved Gmail issue.
- **Creative prompt API reliability is unverified:** historical commits report API generation problems; a fallback is present, but a successful external API response has not been evidenced.

### Security, deployment and assessment-evidence limitations

- **Production secret-name mismatch:** Django settings read `DJANGO_SECRET_KEY`, while the Render manifest configures `SECRET_KEY`. Confirm the effective production value and remove any unsafe fallback before deployment.
- **Tracked local environment file:** `.env.local` is tracked despite the ignore rule and the assessment audit found unresolved conflict markers there. Review it privately, remove it from version control, and rotate any credentials if present. Never copy values into documentation.
- **Deployment parity is not demonstrated:** Render build/deployment configuration exists, but matching local/production behavior, production database operation, persistent media and payment flows are not evidenced.
- **Test coverage is limited:** the current 13-test suite does not comprehensively cover CRUD, invalid form submissions, cart edge cases, payment/webhook handling, responsive layouts or accessibility.
- **Design and assessment records are incomplete:** approved user stories, wireframes, detailed model field documentation, an ERD, comprehensive manual test evidence, a TDD sequence and source/AI attribution records remain TODO.
- **Code-quality/standards results are absent:** no repository-wide Python PEP 8, HTML, CSS or JavaScript validation result is documented.
- **Other route/UI issues need review:** the Stripe webhook is registered at two paths, and no custom 404 redirect behavior is documented. Confirm intended routes and error-page behavior.

Track fixes with stable test IDs and results in [TESTING.md](TESTING.md), and add corresponding dated evidence to [BUGLOG.md](BUGLOG.md).

## Future development

The sequence below is a proposed development backlog informed by the assessment audit; it is not a statement that work is underway.

| Priority | Proposed work | Completion evidence |
|---|---|---|
| P0 | Correct production secret configuration and audit/remove tracked environment files; address credentials safely. | Deployment configuration review, secret-handling evidence and a successful production security check. |
| P0 | Complete variant management and connect variant selection, stock and price through cart, Stripe and order records. | Regression tests for variant CRUD and end-to-end test-mode checkout. |
| P0 | Make guest order persistence compatible with the model and make payment webhook processing idempotent. | Tests for guest/member orders, repeated events, invalid signatures and clear transaction feedback. |
| P1 | Review all state-changing routes and validate form/cart input; complete CRUD and permission coverage. | Route-by-route automated tests and recorded negative/authorization cases. |
| P1 | Verify deployment parity and external integrations in a safe staging/test environment. | Build, migration, static/media, email and Stripe test-mode evidence recorded in TESTING.md. |
| P1 | Establish documented Python/style validation and a repeatable local test setup. | Agreed lint/validation commands, clean reports and saved evidence. |
| P2 | Complete target-user stories, wireframes, model field tables, ERD and design rationale. | Reviewed assessment documentation linked from this README. |
| P2 | Perform responsive/accessibility/manual usability checks and complete attribution. | Dated reports/screenshots, identified assistive technology/devices, and asset/AI-source records. |

## Development setup

### Requirements

- Python 3.10 or newer (the source uses modern Python type syntax; the deployed runtime should be confirmed).
- `pip` and Git.
- Node.js/npm for the media optimization steps in the Render build script.
- Optional service credentials for Stripe, Cloudinary, OpenAI and SMTP, depending on the feature being tested.

### Install and run

```bash
git clone https://github.com/kimpiffy/piffystudiorestore.git
cd piffystudiorestore

python -m venv .venv
# macOS/Linux:
source .venv/bin/activate
# Windows PowerShell:
# .venv\Scripts\Activate.ps1

python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Open `http://127.0.0.1:8000/`.

### Environment configuration

`config/settings.py` reads local dotenv files outside Render and reads runtime environment settings for deployment. Supply secrets through a local, ignored environment file or a deployment secret manager; **never paste secret values into documentation or commit them**.

| Setting name | Purpose |
|---|---|
| `DJANGO_SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` | Django application security and host/debug configuration. |
| `DATABASE_URL` | Optional database URL; without it the app uses SQLite. Render declares PostgreSQL. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Checkout session and signed webhook configuration. |
| `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`, `STRIPE_TEST_PUBLIC_KEY` | Checkout redirect/client configuration when used. |
| `CLOUDINARY_URL` or `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Optional remote media storage. |
| `OPENAI_API_KEY`, `OPENAI_PROMPT_MODEL` | Optional creative-prompt integration. |
| `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` | SMTP sender credentials. |
| `SEO_CANONICAL_BASE_URL`, `SEO_PRODUCTION_HOSTS` | Canonical URL and production SEO host configuration. |

**TODO:** Add a checked-in `.env.example` containing variable names and safe placeholders only; confirm which optional settings are required for local testing versus production. `.env.local` is currently tracked in the repository history; review its contents privately and remove/rotate any credentials if present before distributing the repository.

### Seed shop data

The management command is used by the deployment build and can be run locally:

```bash
python manage.py seed_shop
```

**TODO:** Document how to reset local development data safely and record whether a fresh local database has been verified.

## Testing and assessment evidence

Automated tests are maintained in the apps' `tests.py` modules. A current local test run and the evidence gaps are documented in [TESTING.md](TESTING.md). The Git history shows when tests were added or changed, but does not establish a test-driven-development cycle or historical pass results.

**TODO:** Add approved user stories, wireframes, database schema diagram, manual test evidence and external code/AI attribution records as they are completed.

## Deployment

Render configuration is provided by `render.yaml`; `build.sh` installs npm/Python dependencies, optimizes media, migrates the database, seeds shop data and runs `collectstatic`. The configured start command runs Gunicorn with `config.wsgi:application`.

Before deploying, configure a production secret key, allowed hosts, database and only the service credentials actually required. Verify HTTPS/security settings, Stripe webhook URLs and secrets, Cloudinary behavior, SMTP delivery, backups and static/media persistence in the target environment.

**Deployment status:** Deployment configuration exists in the repository. A current successful deployment and each external integration's production behavior require separate evidence and are not asserted here.

## Credits, licensing and contact

- Frameworks, packages, fonts, images, video and portfolio content retain their respective licenses and ownership.
- **TODO:** Add a complete asset/source attribution table, including externally sourced and AI-assisted material where applicable.
- **TODO:** Confirm the intended project license and repository distribution terms.
- Developer/contact: Kim Piffy; see the published studio contact details on the site.
