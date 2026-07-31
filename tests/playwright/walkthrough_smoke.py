"""Smoke test: landing walkthrough loop loads, autoplays, and steps the full route sequence.

Run with:  python3 tests/playwright/walkthrough_smoke.py [base_url]
"""
import asyncio
import sys
from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
IGNORE = ("favicon", "Download the React DevTools")


async def main() -> int:
    errors: list[str] = []
    failures: list[str] = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await ctx.new_page()
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" and not any(i in m.text for i in IGNORE) else None)
        page.on("pageerror", lambda e: errors.append(str(e)))

        await page.goto(BASE, wait_until="domcontentloaded")

        video = page.get_by_test_id("walkthrough-video")
        await video.wait_for(state="visible", timeout=15000)

        # 1. metadata loads and both sources resolve
        meta = await video.evaluate(
            "async v => { if (v.readyState < 1) await new Promise(r => v.addEventListener('loadedmetadata', r, {once:true}));"
            " return { duration: v.duration, w: v.videoWidth, tracks: v.textTracks.length, loop: v.loop, muted: v.muted }; }"
        )
        if not (meta["duration"] and meta["duration"] > 10):
            failures.append(f"video duration too short: {meta['duration']}")
        if not meta["loop"] or not meta["muted"]:
            failures.append("video must be muted + looping for autoplay")
        if meta["tracks"] < 1:
            failures.append("no caption track attached")

        # 2. autoplay actually advances playback
        t0 = await video.evaluate("v => v.currentTime")
        await page.wait_for_timeout(2500)
        t1 = await video.evaluate("v => v.currentTime")
        if not (t1 > t0 or t1 > 0.5):
            failures.append(f"video did not autoplay ({t0} -> {t1})")

        # 3. captions file is served
        vtt = await page.request.get(f"{BASE}/secp-demo.vtt")
        if not vtt.ok or "WEBVTT" not in (await vtt.text()):
            failures.append("captions file /secp-demo.vtt missing or invalid")

        # 4. full chapter sequence: seek each chapter and confirm transcript follows
        rail = page.get_by_test_id("walkthrough-rail")
        chapters = rail.get_by_role("option")
        count = await chapters.count()
        if count < 10:
            failures.append(f"expected the full route sequence, found {count} chapters")
        line = page.get_by_test_id("walkthrough-transcript-line")
        for i in range(count):
            await chapters.nth(i).click()
            await page.wait_for_timeout(350)
            title = (await chapters.nth(i).inner_text()).splitlines()[1].strip()
            text = await line.inner_text()
            if title.split(" ")[0] not in text:
                failures.append(f"chapter {i} '{title}' did not become active (transcript: {text!r})")

        # 5. keyboard navigation across the rail
        await page.locator("#wt-chapter-0").focus()
        await page.keyboard.press("ArrowDown")
        focused = await page.evaluate("() => document.activeElement.id")
        if focused != "wt-chapter-1":
            failures.append(f"ArrowDown did not move rail focus (focus={focused})")
        await page.keyboard.press("End")
        focused = await page.evaluate("() => document.activeElement.id")
        if focused != f"wt-chapter-{count - 1}":
            failures.append(f"End key did not jump to last chapter (focus={focused})")
        await page.keyboard.press("Enter")
        await page.wait_for_timeout(300)

        # 6. loop wraps back to the start
        await video.evaluate("v => { v.currentTime = Math.max(0, v.duration - 0.4); }")
        await page.wait_for_timeout(2000)
        looped = await video.evaluate("v => v.currentTime")
        if looped > meta["duration"] - 0.4:
            failures.append(f"video did not loop (t={looped})")

        # 7. sign-in route reachable from the landing page
        await page.get_by_role("link", name="Sign in →").first.click()
        await page.wait_for_url("**/auth", timeout=10000)

        await browser.close()

    if errors:
        failures.append(f"console errors: {errors[:5]}")
    for f in failures:
        print("FAIL:", f)
    print("SMOKE:", "PASS" if not failures else f"{len(failures)} failure(s)")
    return 1 if failures else 0


sys.exit(asyncio.run(main()))
