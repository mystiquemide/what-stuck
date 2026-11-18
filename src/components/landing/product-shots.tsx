import QRCode from "qrcode";

/**
 * Real product screens, rebuilt in markup so they stay sharp and match the
 * app exactly. No stock imagery.
 */

export function PhoneReply() {
  return (
    <div className="border-ink/10 bg-ink relative w-[260px] shrink-0 rounded-[44px] border p-2.5 shadow-[0_30px_60px_-20px_rgba(28,25,23,0.35)] sm:w-[280px]">
      <div className="bg-paper overflow-hidden rounded-[36px]">
        <div className="flex justify-center pt-2.5">
          <div className="bg-ink h-5 w-24 rounded-full" aria-hidden />
        </div>
        <div className="px-5 pt-5 pb-6">
          <p className="text-ink-subtle text-[11px] font-medium">
            Hope Street Church · Pressing On
          </p>
          <p className="mt-3 font-serif text-[26px] leading-[1.08] font-medium">
            What will stick with you?
          </p>
          <p className="text-ink-muted mt-2 text-[12px]">A word, a line, a verse.</p>
          <div className="border-line bg-surface mt-4 h-[108px] rounded-xl border-[1.5px] px-3 py-2.5 font-serif text-[15px] leading-snug">
            Grace, not grit. I can finally put it down.
            <span
              className="bg-ink ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse"
              aria-hidden
            />
          </div>
          <div className="mt-3 flex items-start gap-2">
            <span
              className="bg-ink text-paper mt-0.5 flex size-4 items-center justify-center rounded text-[10px]"
              aria-hidden
            >
              ✓
            </span>
            <span className="text-[11px] leading-snug">Send my words back to me on Wednesday</span>
          </div>
          <div className="bg-ink text-paper mt-5 flex h-11 items-center justify-center rounded-xl text-[14px] font-semibold">
            Send
          </div>
          <p className="text-ink-subtle mt-2 text-center text-[10px]">
            Anonymous. Takes ten seconds.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ReportSlice({ className = "" }: { className?: string }) {
  return (
    <div
      className={`border-line bg-surface w-[300px] rounded-2xl border p-5 shadow-[0_24px_48px_-24px_rgba(28,25,23,0.3)] ${className}`}
    >
      <p className="text-ink-subtle text-[11px] font-medium tracking-wide uppercase">
        Monday report
      </p>
      <p className="text-ink-subtle mt-3 text-[11px]">You said</p>
      <p className="font-serif text-[15px] leading-snug">
        You can let go of your past because Christ has already taken hold of you.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-ink-subtle text-[11px]">They heard</span>
        <span className="bg-amber-soft text-amber rounded-full px-2 py-0.5 text-[11px] font-medium">
          Partly
        </span>
      </div>
      <div className="bg-paper mt-2 rounded-lg px-3 py-2 font-serif text-[13px] leading-snug">
        &ldquo;Press on. Work harder at my faith this year.&rdquo;
      </div>
      <p className="text-ink-muted mt-2 text-[11px]">
        4 people heard &ldquo;try harder&rdquo; instead of grace.
      </p>
    </div>
  );
}

export async function SlideShot() {
  const qr = await QRCode.toString("https://whatstuck.midelabs.xyz/demo", {
    type: "svg",
    margin: 0,
    color: { dark: "#1c1917", light: "#ffffff" },
  });
  return (
    <div className="bg-paper ring-line flex aspect-video w-full items-center justify-between gap-4 rounded-xl p-5 ring-1">
      <div>
        <p className="text-ink-subtle text-[10px]">Pressing On</p>
        <p className="mt-1 font-serif text-[22px] leading-[1.05] font-medium">
          What will stick with you?
        </p>
        <p className="text-ink-muted mt-2 text-[10px]">Scan the code. Anonymous.</p>
      </div>
      <div
        className="w-[34%] shrink-0 rounded-lg bg-white p-2"
        // Generated on the server from our own QR library; no user input.
        dangerouslySetInnerHTML={{ __html: qr }}
      />
    </div>
  );
}

export function EmailShot() {
  return (
    <div className="bg-surface ring-line w-full rounded-xl p-5 ring-1">
      <p className="text-ink-subtle text-[10px]">
        Wednesday, 9:00 AM · What stuck with you on Sunday
      </p>
      <p className="text-ink-muted mt-3 text-[11px]">On Sunday you said:</p>
      <p className="font-serif text-[18px] leading-snug">&ldquo;Grace, not grit.&rdquo;</p>
      <p className="text-ink-muted mt-3 text-[11px]">From Philippians 3:13</p>
      <p className="text-ink-muted font-serif text-[13px] leading-snug">
        Forgetting what is behind and straining toward what is ahead&hellip;
      </p>
      <p className="mt-3 text-[11px] font-semibold">What are you ready to put down this week?</p>
    </div>
  );
}

export function ReportShot() {
  return (
    <div className="bg-surface ring-line w-full rounded-xl p-5 ring-1">
      <div className="flex items-center justify-between">
        <p className="font-serif text-[16px] font-medium">Christ has taken hold of me</p>
        <span className="bg-line/70 text-ink-muted rounded-full px-2 py-0.5 text-[11px]">9</span>
      </div>
      <p className="text-ink-muted mt-1 text-[11px]">People felt held, not judged by their past.</p>
      <div className="mt-3 space-y-2">
        <div className="bg-paper rounded-lg px-3 py-2 font-serif text-[13px]">
          &ldquo;I&apos;m held, so I can let go.&rdquo;
        </div>
        <div className="bg-paper rounded-lg px-3 py-2 font-serif text-[13px]">
          &ldquo;He took hold of me first.&rdquo;
        </div>
      </div>
      <p className="bg-clay-soft text-clay mt-3 rounded-lg px-3 py-2 text-[11px]">
        Question people are carrying: How do I forgive myself for something years ago?
      </p>
    </div>
  );
}
