import { expect, test } from "@playwright/test";

test("tcs nqt route exposes dedicated full mock entry", async ({ page }) => {
  await page.goto("/company-prep/tcs-nqt");
  await expect(page.getByRole("heading", { name: "TCS NQT" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Start Full Mock/i })).toBeVisible();
});
