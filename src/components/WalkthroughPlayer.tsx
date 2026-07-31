import { useEffect, useRef, useState } from "react";
import { WALKTHROUGH_CHAPTERS } from "@/lib/walkthrough-chapters";

export function WalkthroughPlayer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [time, setTime] = useState(0);
  const [paused, setPaused] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(true);

  const activeIndex = Math.max(
    0,
    WALKTHROUGH_CHAPTERS.findIndex((c) => time >= c.start && time < c.end),
  );
  const active = WALKTHROUGH_CHAPTERS[activeIndex];

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const track = v.textTracks[0];
    if (track) track.mode = captionsOn ? "showing" : "hidden";
  }, [captionsOn]);

  function seek(index: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = WALKTHROUGH_CHAPTERS[index].start + 0.05;
    setTime(WALKTHROUGH_CHAPTERS[index].start);
    void v.play().catch(() => {});
  }

  function onRailKeyDown(e: React.KeyboardEvent<HTMLDivElement>, index: number) {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = (index + 1) % WALKTHROUGH_CHAPTERS.length;
      document.getElementById(`wt-chapter-${next}`)?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (index - 1 + WALKTHROUGH_CHAPTERS.length) % WALKTHROUGH_CHAPTERS.length;
      document.getElementById(`wt-chapter-${prev}`)?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      document.getElementById("wt-chapter-0")?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      document.getElementById(`wt-chapter-${WALKTHROUGH_CHAPTERS.length - 1}`)?.focus();
    }
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play().catch(() => {});
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <div className="relative border border-border rounded-sm overflow-hidden bg-background">
        <video
          ref={videoRef}
          data-testid="walkthrough-video"
          className="w-full aspect-video block"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-label="Soteria SECP dashboard walkthrough"
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
        >
          <source src="/secp-demo.webm" type="video/webm" />
          <source src="/secp-demo.mp4" type="video/mp4" />
          <track
            default
            kind="captions"
            srcLang="en"
            label="English captions"
            src="/secp-demo.vtt"
          />
        </video>
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-background/70 backdrop-blur px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-accent border border-border">
          <span className="size-1.5 rounded-full bg-[color:var(--signal)] animate-pulse" />
          LIVE_WALKTHROUGH
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2 bg-surface">
          <button
            type="button"
            onClick={togglePlay}
            aria-pressed={paused}
            className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20"
          >
            {paused ? "▸ Play" : "❚❚ Pause"}
          </button>
          <button
            type="button"
            onClick={() => setCaptionsOn((c) => !c)}
            aria-pressed={captionsOn}
            className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground"
          >
            {captionsOn ? "CC on" : "CC off"}
          </button>
          <p
            className="font-mono text-[10px] text-muted-foreground flex-1 min-w-[200px]"
            aria-live="polite"
            data-testid="walkthrough-transcript-line"
          >
            {active.title} — {active.text}
          </p>
        </div>
      </div>

      <div
        role="listbox"
        aria-label="Walkthrough chapters"
        aria-activedescendant={`wt-chapter-${activeIndex}`}
        className="border border-border rounded-sm bg-background max-h-[420px] overflow-y-auto"
        data-testid="walkthrough-rail"
      >
        <div className="px-3 py-2 border-b border-border font-mono text-[9px] uppercase tracking-widest text-muted-foreground sticky top-0 bg-surface">
          On-screen transcript · {WALKTHROUGH_CHAPTERS.length} chapters
        </div>
        {WALKTHROUGH_CHAPTERS.map((c, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={c.title}
              id={`wt-chapter-${i}`}
              type="button"
              role="option"
              aria-selected={isActive}
              onClick={() => seek(i)}
              onKeyDown={(e) => onRailKeyDown(e as unknown as React.KeyboardEvent<HTMLDivElement>, i)}
              className={
                "w-full text-left px-3 py-2 border-b border-border last:border-b-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary " +
                (isActive ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-secondary")
              }
            >
              <span className="font-mono text-[9px] text-accent">
                {String(Math.floor(c.start / 60)).padStart(2, "0")}:
                {String(Math.floor(c.start % 60)).padStart(2, "0")}
              </span>
              <span className="block text-[11px] font-bold">{c.title}</span>
              <span className="block text-[10px] leading-snug mt-0.5">{c.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
