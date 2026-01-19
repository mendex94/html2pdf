import { generateImageInputSchema } from "@/lib/validation-schema";
import { env } from "@/utils/env";
import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const token = req.headers.get("Authorization");

  if (!token || token !== `Bearer ${env.JWT_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const requestBody = await req.json();
  const { data, error } = generateImageInputSchema.safeParse(requestBody);

  if (error || !data) {
    return new Response(error.message, { status: 400 });
  }

  try {
    let browser;

    if (process.env.VERCEL_ENV === "production") {
      const executablePath = await chromium.executablePath();
      browser = await puppeteerCore.launch({
        executablePath,
        args: chromium.args,
        headless: chromium.headless,
        defaultViewport: chromium.defaultViewport,
      });
    } else {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }

    const page = await browser.newPage();

    await page.setViewport({
      width: Math.floor((297 * 120) / 25.4),
      height: Math.floor((210 * 120) / 25.4),
      deviceScaleFactor: 1,
    });

    await page.goto(data.url, {
      waitUntil: "networkidle0",
    });

    const certificate = await page.screenshot({
      type: "png",
      fullPage: true,
    });

    await browser.close();

    return new Response(certificate, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "attachment; filename=certificate.png",
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return new Response(error.message, { status: 500 });
    }
    return new Response("An unknown error occurred.", { status: 500 });
  }
}
