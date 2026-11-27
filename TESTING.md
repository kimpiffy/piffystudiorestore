# TESTING

## 1. About testing

This document records what is tested, how tests were run, and what still needs assessment evidence. It separates automated results from manual checks and historical claims. A feature appearing in source code or a commit message is not, by itself, proof that the feature works.

- Current automated tests use Django's test framework and app-level test modules.
- No historical test-run logs or comprehensive manual-testing report were found in the repository history.
- The historical development record is in [BUGLOG.md](BUGLOG.md).
- No evidence or screenshots from another project are used here.

> **Evidence rule:** Record actual dates, environments, steps, results and evidence paths. Use **TODO** until a test has actually been performed. Do not mark a feature “PASS” based only on code inspection.

## 2. Test identifiers

Each existing automated test has a stable ID below. Use these IDs when discussing test coverage, creating bug-log entries, and recording relevant Git commits. For example, put `AUTO-SHOP-SEED-003` in the Verification column of an ongoing [BUGLOG.md](BUGLOG.md) entry and in the commit body as `Tests: AUTO-SHOP-SEED-003`.

The ID maps to the existing test method, not to an additional test or source-code change. Keep an ID stable when the test is refactored; assign a new ID only for a new, distinct test behavior.

### Automated test inventory

| Test ID | Test module and method | Expected result | Actual result in recorded baseline | Status | Evidence |
|---|---|---|---|---|---|
| `AUTO-AUTH-001` | `accounts.tests.LoginFormRegressionTests.test_login_form_disables_autocapitalization` | Username field has the expected autocapitalization, autocorrect, spellcheck and autocomplete attributes. | All assertions passed. | PASS — 2026-11-27 baseline | `accounts/tests.py` |
| `AUTO-AUTH-002` | `accounts.tests.LoginFormRegressionTests.test_login_page_renders_custom_form_attributes` | Login page returns 200 and rendered HTML contains expected form attributes. | All assertions passed. | PASS — 2026-11-27 baseline | `accounts/tests.py` |
| `AUTO-PORT-001` | `portfolio.tests.CommunityProjectTests.test_digitalis_is_removed_from_community_projects` | Community listing omits the retired project and its detail route returns 404. | All assertions passed. | PASS — 2026-11-27 baseline | `portfolio/tests.py` |
| `AUTO-SHOP-AUTH-001` | `shop.tests.StaffAccessTests.test_non_staff_cannot_access_shop_management` | Authenticated non-staff user is redirected away from product management. | All assertions passed. | PASS — 2026-11-27 baseline | `shop/tests.py` |
| `AUTO-SHOP-AUTH-002` | `shop.tests.StaffAccessTests.test_staff_can_access_shop_management` | Staff user can open product management. | All assertions passed. | PASS — 2026-11-27 baseline | `shop/tests.py` |
| `AUTO-SHOP-SEED-001` | `shop.tests.SeedShopCommandTests.test_seed_command_is_idempotent` | Repeated seeding does not add duplicate products; expected product/category/image counts remain satisfied. | All assertions passed. | PASS — 2026-11-27 baseline | `shop/tests.py` |
| `AUTO-SHOP-SEED-002` | `shop.tests.SeedShopCommandTests.test_seed_command_deletes_retired_products` | Retired products are absent after seeding. | All assertions passed. | PASS — 2026-11-27 baseline | `shop/tests.py` |
| `AUTO-SHOP-SEED-003` | `shop.tests.SeedShopCommandTests.test_seed_command_replaces_existing_placeholder_images` | Seeding replaces a placeholder image without adding a placeholder back. | All assertions passed. | PASS — 2026-11-27 baseline | `shop/tests.py` |
| `AUTO-SHOP-SEED-004` | `shop.tests.SeedShopCommandTests.test_seed_command_populates_gallery_images_for_real_products` | Selected real products have multiple gallery images and no placeholder image. | All assertions passed. | PASS — 2026-11-27 baseline | `shop/tests.py` |
| `AUTO-SHOP-SEED-005` | `shop.tests.SeedShopCommandTests.test_seed_command_prefers_webp_gallery_files_over_png_duplicates` | Seeded gallery uses WebP image files rather than PNG duplicates. | All assertions passed. | PASS — 2026-11-27 baseline | `shop/tests.py` |
| `AUTO-SHOP-PAGE-001` | `shop.tests.SeedShopCommandTests.test_shop_pages_render_with_local_placeholder_media` | Shop and detail pages render expected product/media elements and omit retired/placeholder content; staff product management renders. | All assertions passed. | PASS — 2026-11-27 baseline | `shop/tests.py` |
| `AUTO-SHOP-PAY-001` | `shop.tests.StripeCheckoutConfigurationTests.test_checkout_redirects_cleanly_when_stripe_is_unconfigured` | Unconfigured Stripe checkout returns to cart and displays a Stripe-related message. | All assertions passed. | PASS — 2026-11-27 baseline | `shop/tests.py` |
| `AUTO-SHOP-CONTACT-001` | `shop.tests.ContactMessageTests.test_contact_submission_renders_visible_success_banner` | Valid contact submission renders visible success feedback. | All assertions passed. | PASS — 2026-11-27 baseline | `shop/tests.py` |

This inventory documents the current 13 tests; it does not claim coverage beyond the assertions described.

## 3. Automated test baseline

### Latest recorded run

| Date | Revision | Expected result | Actual result | Status | Evidence |
|---|---|---|---|---|---|
| 2026-11-27 | [`86f3708`](https://github.com/kimpiffy/piffystudiorestore/commit/86f3708) | All 13 tests pass under isolated local-development settings, without loading local dotenv credentials. | 13 tests passed in 26.730 seconds; Django system check reported no issues. The runner warned that `staticfiles/` did not exist. | PASS — recorded baseline | Test-run output in the prior assessment session; this file records the result, not a contemporaneous CI artifact. |

The recorded run used an in-memory SQLite test database, `DEBUG=true`, settings loaded without reading `.env` or `.env.local`, and `RENDER` unset before tests started. This result is limited to the automated tests under that local setup; it does not verify production deployment, external services, payment collection or manual browser behavior.

### Reproducing the recorded local setup

The following command is the command recorded for the baseline, from the repository root with dependencies installed and the virtual environment active:

```bash
python -c 'import os; os.environ["DJANGO_SETTINGS_MODULE"]="config.settings"; os.environ["RENDER"]="1"; os.environ["DEBUG"]="true"; os.environ["DATABASE_URL"]="sqlite:///:memory:"; import config.settings; os.environ.pop("RENDER", None); from django.core.management import execute_from_command_line; execute_from_command_line(["manage.py", "test"])'
```

The settings module is imported while `RENDER` is set so local dotenv files are not loaded. `RENDER` is then removed before running tests because the shop seeding command has Render-specific behavior. `DEBUG=true` enables local-development settings for the test client.

For an ordinary local environment where environment loading has been reviewed and configured, the standard Django command is:

```bash
python manage.py test
```

**TODO:** Confirm and document a short, cross-platform test command after local environment setup is standardized. Never add real environment credentials to this document.

## 4. TDD evidence

### What the Git history shows

- The initial commit, [`ccd2528`](https://github.com/kimpiffy/piffystudiorestore/commit/ccd2528), created app test modules as empty Django test stubs.
- The first substantive shop test suite is visible in [`a0b2297`](https://github.com/kimpiffy/piffystudiorestore/commit/a0b2297) on 18 August 2026, after the shop, checkout and staff workflows had already been developed.
- Further regression tests were added or revised alongside later shop-media and authentication changes, including [`7eba725`](https://github.com/kimpiffy/piffystudiorestore/commit/7eba725), [`9aaf403`](https://github.com/kimpiffy/piffystudiorestore/commit/9aaf403) and [`e33cd75`](https://github.com/kimpiffy/piffystudiorestore/commit/e33cd75).
- The 21 August 2026 commit titled “MANUAL TESTING AMENDMENTS” ([`4c44d72`](https://github.com/kimpiffy/piffystudiorestore/commit/4c44d72)) changes CSS only; it is not evidence that test code or test results were added.
- The history reviewed for [BUGLOG.md](BUGLOG.md) does not show test-first commits, recorded red/green runs or contemporaneous CI results.

**Conclusion:** Automated regression tests exist and the current 13-test suite passed in the recorded local run. A test-driven development process is **not evidenced** by the available history; this does not establish whether informal test-first work occurred outside Git.

### Continuing TDD record

For future work, add a test before implementation, record the failing result, implement the smallest change, and record the passing result. Include the relevant test ID in the test report and commit body.

| Test ID | Date | Requirement / behavior | Expected result | Actual result | Status | Red/green evidence and commit |
|---|---|---|---|---|---|---|
| TODO | TODO | TODO | TODO | TODO | TODO | TODO: Link the failing run, implementation commit and passing run. |

## 5. Manual and integration testing

No comprehensive manual test record or browser screenshots were found in the repository. The following tables are plans, not records of completed tests. Assign a unique ID to each manual test and retain it when recording the result.

### Browser, device and responsive checks

| Test ID | Page / feature | Browser, device and viewport | Steps | Expected result | Actual result | Status | Evidence |
|---|---|---|---|---|---|---|---|
| `MAN-BROWSER-001` | Home and navigation | TODO | Open/close navigation, follow routes, test keyboard focus and check clipping/scroll behavior. | Navigation and links work at selected viewport sizes without clipped content or unusable controls. | TODO | TODO — not evidenced | TODO |
| `MAN-BROWSER-002` | About | TODO | Exercise desktop/mobile interactions; inspect text, images and navigation. | Content remains readable and controls usable at tested sizes. | TODO | TODO — not evidenced | TODO |
| `MAN-BROWSER-003` | Art and Digital portfolios | TODO | Navigate projects, open/close overlays, resize and rotate. | Project content, overlays and scrolling work as intended. | TODO | TODO — not evidenced | TODO |
| `MAN-BROWSER-004` | Community/project details | TODO | Open a project, use gallery controls and return to project list; check keyboard and touch input. | Project navigation and gallery controls work for tested input methods. | TODO | TODO — not evidenced | TODO |
| `MAN-BROWSER-005` | Styles and Industry viewers | TODO | Open viewer, use page controls/fallback links, resize and test mobile scrolling. | Document content and fallback remain usable at tested sizes. | TODO | TODO — not evidenced | TODO |
| `MAN-BROWSER-006` | Contact and footer | TODO | Submit valid/invalid forms, open/close success feedback, operate footer links/touch controls. | Validation and feedback are understandable; controls work with tested input methods. | TODO | TODO — not evidenced | TODO |
| `MAN-BROWSER-007` | Shop, cart and product details | TODO | Browse products, open details, add/update/remove cart items, check totals and galleries. | Correct products, quantities, totals and images are shown through the cart flow. | TODO | TODO — not evidenced | TODO |
| `MAN-BROWSER-008` | Login and staff dashboard | TODO | Check sign-in/out and staff-only routes with staff and non-staff accounts. | Authentication and authorization match the intended permissions. | TODO | TODO — not evidenced | TODO |

**TODO:** Capture Piffy Studio screenshots only. Record browser/version, device or emulation mode, viewport dimensions, test date and image path. Do not reuse screenshots or test results from another project.

### Forms and data validation

| Test ID | Form / workflow | Steps and test data | Expected result | Actual result | Status | Evidence |
|---|---|---|---|---|---|---|
| `MAN-FORM-001` | Contact message | Test missing required fields, malformed email, no category, “other” without explanation, honeypot filled, valid submission and newsletter opt-in. | Invalid inputs receive clear errors and are not saved; valid input creates the intended message/subscriber records and feedback. | TODO | TODO — not evidenced | TODO |
| `MAN-FORM-002` | Product/category/variant management | Test valid create/update, missing/invalid fields, duplicates, delete confirmation and staff authorization. | Valid changes persist; invalid requests are rejected safely; only permitted staff can mutate data. | TODO | TODO — not evidenced | TODO |
| `MAN-FORM-003` | Product image management | Test unsupported/oversized/missing files, multi-image upload, deletion and reordering. | Invalid uploads are rejected with feedback; accepted files and ordering persist. | TODO | TODO — not evidenced | TODO |
| `MAN-FORM-004` | Cart | Test quantity boundaries, unavailable product/variant, price calculation, removal and persistence. | Invalid quantities are rejected; displayed totals and item state match server-side data. | TODO | TODO — not evidenced | TODO |
| `MAN-FORM-005` | Newsletter management | Test duplicate addresses, active state, CSV export and non-staff access. | Subscriber records are handled consistently and private management/export actions are staff-only. | TODO | TODO — not evidenced | TODO |

### Payment, email, media and external services

| Test ID | Integration | Test method | Expected result | Actual result | Status | Evidence |
|---|---|---|---|---|---|---|
| `INT-STRIPE-001` | Stripe Checkout | Use Stripe test mode; check checkout creation, cancel/success return and resulting order data. | Test checkout produces a consistent order and clear feedback without a live charge. | TODO | TODO — not evidenced | TODO |
| `INT-STRIPE-002` | Stripe webhook | Send valid/invalid signatures in a controlled environment; replay an event. | Valid events create one order; invalid signatures are rejected; replay does not duplicate the order. | TODO | TODO — not evidenced | TODO |
| `INT-MEDIA-001` | Cloudinary | In a non-production account, seed/reseed media and inspect canonical names and overwrites. | Media is available remotely without creating duplicate growth or replacing protected live images. | TODO | TODO — not evidenced | TODO |
| `INT-EMAIL-001` | SMTP email | Use a safe test recipient/account and verify delivery and configuration-error handling. | Expected email is delivered or a clear error is recorded; no credentials appear in logs/evidence. | TODO | TODO — not evidenced | TODO |
| `INT-API-001` | Creative prompt API | Test with a valid key, absent key, API error/timeout and fallback. | Valid requests return a prompt; failures use the intended fallback and do not expose credentials. | TODO | TODO — not evidenced | TODO |

No successful live or sandbox integration result is asserted here. Do not use production customer or payment data for testing.

## 6. Python code quality and PEP 8 validation

No repository-wide Python linter configuration or PEP 8 report is documented. The checks below are a validation plan; they have **not** been run as part of this documentation update. Select and document the project's linter/version before claiming PEP 8 conformance.

| Test ID | Check | Suggested method | Expected result | Actual result | Status | Evidence |
|---|---|---|---|---|---|---|
| `CODE-PY-001` | Django system checks | `python manage.py check` under documented local settings. | No unresolved Django system-check errors. | TODO | TODO — not evidenced here | TODO |
| `CODE-PY-002` | Python syntax compilation | `python -m compileall -q accounts config interactions pages portfolio shop` | All project Python modules compile. | TODO | TODO — not evidenced here | TODO |
| `CODE-PY-003` | PEP 8/style lint | TODO: Select/configure a linter and run its project command; record tool/version and agreed exceptions. | No unapproved style violations; exceptions are documented and limited. | TODO | TODO — not evidenced here | TODO |
| `CODE-REVIEW-001` | Defensive coding and review | Review validation, authorization, error paths, duplicated logic, comments and separation of concerns. | Review findings are fixed or tracked with a test ID and BUGLOG entry. | TODO | TODO — not evidenced here | TODO |

**TODO:** Add the selected Python lint tool/configuration and repeatable command to the project setup only after the project owner approves it. This document update does not install tooling or change application code.

## 7. Deployment testing and development/production parity

Render configuration exists, but parity and successful production behavior have not been established by the test evidence recorded here. Run deployment checks in a disposable/staging environment, not against production customer/payment data. Compare behavior and settings rather than copying secrets between environments.

| Test ID | Deployment area | Method | Expected result | Actual result | Status | Evidence |
|---|---|---|---|---|---|---|
| `DEPLOY-PARITY-001` | Development/production configuration | Compare Python/Django/dependency versions, DEBUG, hosts, database engine, static storage and enabled integrations. | Differences are intentional, documented and do not change required user journeys. Secrets remain environment-specific. | TODO | TODO — not evidenced | TODO |
| `DEPLOY-BUILD-001` | Render build | Run the configured build pipeline in staging, including dependencies, media optimization, migrations, shop seed and `collectstatic`. | Build exits successfully; migrations/static assets/seeding complete without destructive unintended changes. | TODO | TODO — not evidenced | TODO |
| `DEPLOY-DB-001` | Production-like database | Apply migrations and exercise representative reads/writes against a staging PostgreSQL database. | Schema matches current models and transactions persist correctly without relying on local SQLite-only behavior. | TODO | TODO — not evidenced | TODO |
| `DEPLOY-STATIC-001` | Static and uploaded media | Verify collected static URLs, WhiteNoise delivery, media storage and reseeding behavior in staging. | Static assets and product media load; seeding preserves intended existing remote assets. | TODO | TODO — not evidenced | TODO |
| `DEPLOY-SEC-001` | Production security settings | Review DEBUG, effective secret key source, allowed hosts, HTTPS, cookies, CSRF, HSTS and tracked environment files. | Production uses a strong secret from the intended environment variable, DEBUG is off, and no credentials are committed. | TODO | TODO — not evidenced | TODO |
| `DEPLOY-SMOKE-001` | Deployed route smoke test | Request home, contact, portfolio, shop, login, sitemap and robots routes; check browser console and internal links. | Intended routes return expected status/content and no material broken asset/internal links. | TODO | TODO — not evidenced | TODO |
| `DEPLOY-STRIPE-001` | Deployed Stripe test mode | Use staging/test credentials and a test webhook endpoint. | Checkout, signature validation, idempotency, order persistence and success/cancel feedback match local expectations. | TODO | TODO — not evidenced | TODO |

The checkout route, webhook, guest order persistence, and `DJANGO_SECRET_KEY`/Render `SECRET_KEY` configuration have known limitations. Resolve and test these findings before treating parity or production payment behavior as complete; see [README.md](README.md#known-issues-and-current-limitations).

## 8. Validation and accessibility

The Git history includes responsive and accessibility-related changes, but no current standards-validation reports, Lighthouse results, assistive-technology results or contrast measurements were located.

| Test ID | Check | Method | Expected result | Actual result | Status | Evidence |
|---|---|---|---|---|---|---|
| `VAL-HTML-001` | HTML structure | Validate representative rendered pages with the W3C Nu HTML Checker. | No unaddressed errors; any accepted warnings are explained. | TODO | TODO — not evidenced | TODO: date, URLs and reports. |
| `VAL-CSS-001` | CSS | Validate authored CSS with W3C CSS Validator; triage framework/vendor warnings separately. | No unaddressed authored-CSS errors; exceptions are recorded. | TODO | TODO — not evidenced | TODO |
| `VAL-JS-001` | JavaScript | Run an approved lint/static check and inspect browser console on key interactions. | No unaddressed errors; tool/version and exceptions are recorded. | TODO | TODO — not evidenced | TODO |
| `VAL-A11Y-001` | Accessibility | Keyboard-only navigation, focus visibility, labels, headings, dialogs, zoom/reflow and screen-reader spot checks. | Key pages and interactions are usable with the documented assistive technologies and meet agreed accessibility criteria. | TODO | TODO — not evidenced | TODO: tool, browser and findings. |
| `VAL-CONTRAST-001` | Contrast | Measure text and interactive-state contrast against WCAG criteria. | Required text/control contrast thresholds are met or remediation is logged. | TODO | TODO — not evidenced | TODO: tool, components and measured ratios. |
| `VAL-SEO-001` | Performance/SEO | Lighthouse or equivalent on representative public pages; inspect metadata and sitemap/robots behavior. | Scores/findings and SEO behavior are recorded; defects are tracked. | TODO | TODO — not evidenced | TODO |

## 9. User-story testing

The user journeys in [README.md](README.md) are derived from current routes and features, not recovered approved stories. Complete this section after user stories and acceptance criteria are reviewed.

| Test ID | Approved user story | Steps / acceptance criteria | Expected result | Actual result | Status | Evidence |
|---|---|---|---|---|---|---|
| `STORY-001` | TODO: Visitor explores portfolio work. | TODO | TODO | TODO | TODO — not evidenced | TODO |
| `STORY-002` | TODO: Potential client submits an enquiry. | TODO | TODO | TODO | TODO — not evidenced | TODO |
| `STORY-003` | TODO: Customer completes a test-mode shop checkout. | TODO | TODO | TODO | TODO — not evidenced | TODO |
| `STORY-004` | TODO: Staff manages a product and reviews contact submissions. | TODO | TODO | TODO | TODO — not evidenced | TODO |

## 10. Known issues and bug log

- Historical bug and fix reconstruction: [BUGLOG.md](BUGLOG.md).
- The original 2025-11-29 product-image upload entry is retained verbatim there.
- Current test issues or newly discovered defects should be added to the “Ongoing testing and bug fixes from 27 November 2026 onwards” section of `BUGLOG.md`, with reproduction steps and actual verification evidence.
- Reference automated/manual test IDs in a BUGLOG verification field, for example `AUTO-SHOP-SEED-003`; include the same ID in the relevant Git commit body.
- **TODO:** Link newly discovered issues here only when they materially affect the test plan.

## 11. Test evidence and attribution

Store new reports/screenshots in a Piffy Studio-specific location, use descriptive filenames and link them in the tables above. Avoid personal data, customer information, payment details, API tokens and other secrets in screenshots or logs.

| Evidence item | Expected record | Actual record | Status | Evidence |
|---|---|---|---|---|
| Current automated suite | Run all current tests after application changes. | 13/13 passed in the recorded 2026-11-27 baseline. | PASS — baseline only | Prior assessment-session output; no CI artifact located. |
| Manual desktop/mobile screenshots | Dated screenshots with page, browser, device and viewport labels. | TODO | TODO | TODO |
| HTML/CSS validation reports | Dated validator output and list of tested pages/files. | TODO | TODO | TODO |
| Accessibility/contrast reports | Tool, browser/assistive technology, scope and measured outcomes. | TODO | TODO | TODO |
| Stripe test-mode/webhook evidence | Redacted test-mode event/response details and order outcome. | TODO | TODO | TODO |
| Cloudinary and SMTP integration evidence | Safe staging account, test steps and observed result. | TODO | TODO | TODO |
| AI/external source attribution | Source, license/permission and scope of any AI assistance. | TODO | TODO | TODO |
