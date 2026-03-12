import { beforeAll, describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("react-turnstile", () => ({
  default: ({ sitekey }: { sitekey: string }) => (
    <div data-turnstile-sitekey={sitekey}>Mock Turnstile</div>
  ),
}));

let TurnstileWidgetContent: typeof import("../turnstile-widget").TurnstileWidgetContent;

describe("TurnstileWidget", () => {
  beforeAll(async () => {
    ({ TurnstileWidgetContent } = await import("../turnstile-widget"));
  });

  test("renders a local bypass action when turnstile is bypassed", () => {
    const markup = renderToStaticMarkup(
      <TurnstileWidgetContent
        onVerify={() => {}}
        turnstile={{ mode: "bypass", verificationToken: "local-bypass" }}
      />
    );

    expect(markup).toContain("Continue with local verification bypass");
  });

  test("renders a configuration message when turnstile is misconfigured", () => {
    const markup = renderToStaticMarkup(
      <TurnstileWidgetContent
        onVerify={() => {}}
        turnstile={{
          mode: "misconfigured",
          reason:
            "Turnstile is enabled for prod, but NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set.",
        }}
      />
    );

    expect(markup).toContain("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
  });

  test("renders the widget when turnstile is configured", () => {
    const markup = renderToStaticMarkup(
      <TurnstileWidgetContent
        onVerify={() => {}}
        turnstile={{ mode: "widget", siteKey: "widget-site-key" }}
      />
    );

    expect(markup).toContain("Mock Turnstile");
    expect(markup).toContain("widget-site-key");
  });
});
