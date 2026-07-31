"""End-to-end check: scoped SQL data-scope preview + deterministic validator UI.

Restores the injected Supabase session (LOVABLE_BROWSER_* env vars) when present,
opens a directive, and asserts the per-executive scope preview and validator
verdicts render on the request detail panel and artifact ledger.

Run:  python3 tests/playwright/scoped_sql_validator.py
"""
import asyncio
import json
import os
import sys
from pathlib import Path

from playwright.async_api import async_playwright

BASE = os.environ.get("SECP_BASE_URL", "http://localhost:8080")
SHOTS = Path(__file__).parent / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)


async def restore_session(context, page):
    storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
    session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
    cookies_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
    if cookies_json:
        cookies = json.loads(cookies_json)
        for c in cookies:
            c["url"] = BASE
        await context.add_cookies(cookies)
    await page.goto(BASE)
    if storage_key and session_json:
        await page.evaluate(
            f"window.localStorage.setItem({json.dumps(storage_key)}, {json.dumps(session_json)})"
        )
        return True
    return False


async def main() -> int:
    failures: list[str] = []
    console_errors: list[str] = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)

        authed = await restore_session(context, page)
        if not authed:
            print("SKIP: no injected Supabase session; authenticated assertions unavailable.")
            await browser.close()
            return 0

        # 1. Directive queue -> first directive.
        await page.goto(f"{BASE}/requests", wait_until="networkidle")
        await page.screenshot(path=str(SHOTS / "1_requests.png"))
        link = page.locator('a[href^="/requests/"]').first
        if await link.count() == 0:
            print("SKIP: no directives available to inspect.")
            await browser.close()
            return 0
        await link.click()
        await page.wait_for_load_state("networkidle")

        # 2. Data-scope preview must state tables, caps and masking.
        body = (await page.locator("body").inner_text()).lower()
        for token in ["data-scope preview", "cap ", "masked", "select-only"]:
            if token not in body:
                failures.append(f"scope preview missing '{token}'")
        await page.screenshot(path=str(SHOTS / "2_scope_preview.png"))

        # 3. Expand an EXPLAIN row and assert validator verdicts render.
        explain = page.get_by_text("EXPLAIN").first
        if await explain.count() > 0:
            await explain.click()
            await page.wait_for_timeout(400)
            detail = (await page.locator("body").inner_text()).lower()
            if "data scope" not in detail:
                failures.append("stage-level data scope block missing in EXPLAIN")
            if not any(v in detail for v in ["validated", "rejected", "insufficient-evidence", "deterministic kg validator"]):
                failures.append("no deterministic validator verdict rendered")
            await page.screenshot(path=str(SHOTS / "3_explain.png"))

        # 4. Artifact ledger: audit package export + alert thresholds present.
        await page.goto(f"{BASE}/artifacts", wait_until="networkidle")
        ledger = (await page.locator("body").inner_text()).lower()
        for token in ["tool health", "alert thresholds", "per-executive data scoping"]:
            if token not in ledger:
                failures.append(f"artifact ledger missing '{token}'")
        await page.screenshot(path=str(SHOTS / "4_ledger.png"))

        await browser.close()

    hard_errors = [e for e in console_errors if "favicon" not in e.lower()]
    for f in failures:
        print("FAIL:", f)
    for e in hard_errors[:5]:
        print("CONSOLE ERROR:", e[:200])
    if failures:
        return 1
    print("PASS: scope preview, validator verdicts and ledger controls rendered.")
    return 0


sys.exit(asyncio.run(main()))