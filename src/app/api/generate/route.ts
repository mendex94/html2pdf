import { generatePDFInputSchema } from "@/lib/validation-schema";
import { env } from "@/utils/env";
import puppeteer from "puppeteer";

export async function POST(req: Request) {
  const token = req.headers.get("Authorization");

  if (!token || token !== `Bearer ${env.JWT_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const requestBody = await req.json();
  const { data, error } = generatePDFInputSchema.safeParse(requestBody);

  if (error || !data) {
    return new Response(error.message, { status: 400 });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: Math.floor((297 * 96) / 25.4),
      height: Math.floor((210 * 96) / 25.4),
      deviceScaleFactor: 2,
    });

    await page.goto(data.url, {
      waitUntil: "networkidle0",
    });

    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();

    return new Response(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=download.pdf",
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return new Response(error.message, { status: 500 });
    }
    return new Response("An unknown error occurred", { status: 500 });
  }
}