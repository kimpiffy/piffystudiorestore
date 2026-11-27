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

The original inventory documents 13 tests; Task 002 adds four production-configuration tests, for 17 tests total. This does not claim coverage beyond the assertions described.

### Production configuration security tests

These configuration tests were added in Task 002; they run the settings module in isolated child processes and do not print secret values.

| Test ID | Test module and method | Purpose / assertions | Result |
|---|---|---|---|
| `AUTO-CONFIG-SEC-001` | `config.tests.ProductionSettingsTests.test_render_forces_debug_off_and_uses_django_secret_key` | Render settings force `DEBUG=False` even when the environment says true and load `DJANGO_SECRET_KEY`. | PASS — Task 002 |
| `AUTO-CONFIG-SEC-002` | `config.tests.ProductionSettingsTests.test_render_accepts_existing_secret_key_during_migration` | Existing Render `SECRET_KEY` remains accepted during the environment-variable rename. | PASS — Task 002 |
| `AUTO-CONFIG-SEC-003` | `config.tests.ProductionSettingsTests.test_production_without_a_secret_key_fails_to_start` | Production settings fail closed rather than using a development fallback when no secret is configured. | PASS — Task 002 |
| `AUTO-CONFIG-SEC-004` | `config.tests.ProductionSettingsTests.test_render_manifest_uses_secure_production_settings` | Render manifest declares `DJANGO_SECRET_KEY` and disables DEBUG. | PASS — Task 002 |

## 3. Automated test baseline

### Latest recorded run

| Date | Revision | Expected result | Actual result | Status | Evidence |
|---|---|---|---|---|---|
| 2026-11-27 | [`86f3708`](https://github.com/kimpiffy/piffystudiorestore/commit/86f3708) | All 13 tests pass under the previously isolated local-development setup. | 13 tests passed in 26.730 seconds; Django system check reported no issues. The runner warned that `staticfiles/` did not exist. | PASS — historical baseline | Test-run output in the prior assessment session; this file records the result, not a contemporaneous CI artifact. |
| 2026-11-27 | [`7dfd648`](https://github.com/kimpiffy/piffystudiorestore/commit/7dfd6483ef3ee4e65b704a698f788e18faa87a47) | All 13 existing tests pass with dedicated test settings; migrations apply; no production service or repository media/database is used. | 13 tests passed in 24.663 seconds. Django system checks reported no issues; migrations applied; the missing-`staticfiles/` warning was resolved. | PASS — Task 001 | Local test-run output, 27 Nov 2026. |
| 2026-11-27 | [`cdbf618`](https://github.com/kimpiffy/piffystudiorestore/commit/cdbf618c840a720017e9c3d5c6e4361fffeb1a93) | The same 13 tests pass under coverage measurement. | 13 tests passed in 54.800 seconds. Coverage scope: 1,330 statements and 432 branches; 745 statements and 179 branches covered; statement coverage 56.0%, branch coverage 41.4%, combined coverage 52.4%. | PASS — measured baseline | Local `coverage.py` 7.6.1 run and JSON report, 27 Nov 2026. |
| 2026-11-27 | Task 002 security-test commit [`2c193b8`](https://github.com/kimpiffy/piffystudiorestore/commit/2c193b8199f273691d60d9479db30ab73876974f) | New production security tests should reject insecure Render DEBUG/key behavior and require the Render manifest to use the Django setting name. | **Red:** 4 new tests ran; all 4 failed against the pre-fix configuration: production accepted a missing key, Render left DEBUG enabled, the existing `SECRET_KEY` alias was ignored, and the manifest used `SECRET_KEY`. | FAIL — expected TDD red | Isolated test-run output, 27 Nov 2026. |
| 2026-11-27 | Task 002 implementation [`06a1bf4`](https://github.com/kimpiffy/piffystudiorestore/commit/06a1bf4000fdf99784bac646911b589ef5efcfb0) | All existing and new tests pass under dedicated settings. | 17 tests passed in 26.919 seconds; migrations applied; Django system checks reported no issues. | PASS — security fix verification | Local test-run output, 27 Nov 2026. |
| 2026-11-27 | Task 002 coverage run | The 17-test suite passes under branch coverage measurement. | 17 tests passed in 57.483 seconds. Configured scope: 1,338 statements and 438 branches; 750 statements and 181 branches covered; statement coverage 56.1%, branch coverage 41.3%, combined coverage 52.4%. | PASS — measured Task 002 baseline | Local `coverage.py` 7.6.1 run and JSON report, 27 Nov 2026. |

The historical `86f3708` run used an in-memory SQLite test database and local-development settings; it warned that `staticfiles/` was missing. The Task 001 runs use the dedicated `config.test_settings` module described below. These results do not verify production deployment, external services, payment collection or manual browser behavior.

### Dedicated isolated test configuration

Install the development dependencies once from the repository root:

```bash
python -m pip install -r requirements-dev.txt
```

Run the complete suite with:

```bash
python manage.py test --settings=config.test_settings
```

`config.test_settings` prevents base settings from reading `.env` or `.env.local` by setting `RENDER` during base-settings import, then removes it before the tests start so `seed_shop` follows local behavior. It forces an in-memory SQLite database, temporary media and static roots, filesystem media storage, Django's in-memory email backend and blank Stripe, Cloudinary, OpenAI and SMTP credentials. Its temporary directories are removed when the process exits. It also enables `DEBUG` and disables HTTPS-only redirects/cookies strictly for the test client; production settings are unchanged. These settings prevent the application's configured Stripe, Cloudinary, OpenAI and SMTP integrations from reaching their external services during this suite.

The static root is created within the temporary test directory, avoiding the previous WhiteNoise warning about a missing `staticfiles/` directory. No existing test files or assertions were changed.

### Measuring code coverage

The report uses branch measurement. Coverage is configured in `.coveragerc` for the Django project packages; test modules, migrations, test settings, ASGI/WSGI entry points and `manage.py` are excluded. After installing `requirements-dev.txt`, run:

```bash
python -m coverage run --rcfile=.coveragerc manage.py test --settings=config.test_settings
python -m coverage report --rcfile=.coveragerc
```

The first command replaces the current coverage data with a fresh test run; the second prints the measured report. The Task 001 baseline was **56.0% statement coverage, 41.4% branch coverage, and 52.4% combined coverage** across 1,330 statements and 432 branches. After Task 002, coverage is **56.1% statement, 41.3% branch, and 52.4% combined** across 1,338 statements and 438 branches. The four security tests launch isolated subprocesses to verify settings imports; coverage.py does not measure those child processes, so the production-only settings branches they exercise are not included in the coverage totals. This is measured code coverage, not a claim that the application's features are 52.4% functionally tested. The report showed particularly low coverage in `shop/views.py` (26.4%), `interactions/views.py` (21.1%) and `accounts/views.py` (43.5%).

## 4. TDD evidence

### What the Git history shows

- The initial commit, [`ccd2528`](https://github.com/kimpiffy/piffystudiorestore/commit/ccd2528), created app test modules as empty Django test stubs.
- The first substantive shop test suite is visible in [`a0b2297`](https://github.com/kimpiffy/piffystudiorestore/commit/a0b2297) on 18 August 2026, after the shop, checkout and staff workflows had already been developed.
- Further regression tests were added or revised alongside later shop-media and authentication changes, including [`7eba725`](https://github.com/kimpiffy/piffystudiorestore/commit/7eba725), [`9aaf403`](https://github.com/kimpiffy/piffystudiorestore/commit/9aaf403) and [`e33cd75`](https://github.com/kimpiffy/piffystudiorestore/commit/e33cd75).
- The 21 August 2026 commit titled “MANUAL TESTING AMENDMENTS” ([`4c44d72`](https://github.com/kimpiffy/piffystudiorestore/commit/4c44d72)) changes CSS only; it is not evidence that test code or test results were added.
- Before Task 002, the repository history did not show test-first commits, recorded red/green runs or contemporaneous CI results.

- Task 002 provides explicit red/green evidence: four configuration-security tests were committed separately in [`2c193b8`](https://github.com/kimpiffy/piffystudiorestore/commit/2c193b8199f273691d60d9479db30ab73876974f). **Red result:** all four failed against the old configuration: missing production key did not stop startup; Render retained `DEBUG=True`; legacy Render `SECRET_KEY` was ignored; and `render.yaml` used the mismatched key name. After the implementation commit [`06a1bf4`](https://github.com/kimpiffy/piffystudiorestore/commit/06a1bf4000fdf99784bac646911b589ef5efcfb0), all four passed as part of the complete 17-test suite.

**Conclusion:** The original tests are regression tests, but their history does not prove they were written test-first. Task 002 demonstrates a genuine test-first sequence for the production configuration defects.

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
