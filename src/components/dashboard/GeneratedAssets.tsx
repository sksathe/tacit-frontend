import { useState } from "react";

interface Asset {
  type: string;
  title: string;
  icon: string;
  timestamp: string;
}

interface GeneratedAssetsProps {
  assets: Asset[];
  onViewAsset?: (asset: Asset) => void;
  resolveAssetContent?: (asset: Asset) => string | null | undefined;
  variant?: "full" | "compact";
}

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function GeneratedAssets({
  assets,
  onViewAsset,
  resolveAssetContent,
  variant = "full",
}: GeneratedAssetsProps) {
  const [copiedAssetKey, setCopiedAssetKey] = useState<string | null>(null);

  const viewAsset = (asset: Asset) => {
    if (onViewAsset) {
      onViewAsset(asset);
      return;
    }
    console.warn("View asset clicked, but no handler provided.", asset);
  };

  const getAssetText = (asset: Asset) => {
    const resolved = resolveAssetContent?.(asset)?.trim();
    if (resolved) return resolved;

    return [
      `${asset.title}`,
      `Type: ${asset.type}`,
      `Generated: ${asset.timestamp}`,
      "",
      "No detailed content is available yet. Open this asset to inspect details.",
    ].join("\n");
  };

  const copyAsset = async (asset: Asset) => {
    const assetKey = `${asset.type}-${asset.timestamp}`;
    const text = getAssetText(asset);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "absolute";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopiedAssetKey(assetKey);
      window.setTimeout(() => {
        setCopiedAssetKey((current) => (current === assetKey ? null : current));
      }, 1400);
    } catch (error) {
      console.error("Failed to copy asset text:", error);
    }
  };

  const downloadAsset = (asset: Asset) => {
    const text = getAssetText(asset);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${toSlug(asset.title || asset.type || "generated-asset")}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  };

  if (assets.length === 0) {
    return null;
  }

  if (variant === "compact") {
    return (
      <div id="generated-assets-section" className="rounded-xl border border-primary/25 bg-card/55 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <h3 className="text-sm font-extrabold text-primary">Generated assets</h3>
            <p className="mt-0.5 text-[0.7rem] text-muted-foreground">Latest first</p>
          </div>
          <span className="rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-primary">
            {assets.length}
          </span>
        </div>

        <div className="space-y-2.5">
          {assets.slice(0, 3).map((asset, index) => {
            const assetKey = `${asset.type}-${asset.timestamp}`;
            const isCopied = copiedAssetKey === assetKey;
            return (
              <div
                key={`${asset.type}-${asset.timestamp}-${index}`}
                className="rounded-lg border border-primary/20 bg-background/40 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-lg">
                      {asset.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{asset.title}</div>
                      <div className="truncate font-mono text-[0.65rem] text-muted-foreground">{asset.timestamp}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => viewAsset(asset)}
                    className="rounded-md bg-primary px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary-glow"
                  >
                    View
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyAsset(asset)}
                    className="rounded-md border border-primary/35 bg-transparent px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-wide text-primary transition-all hover:bg-primary/10"
                  >
                    {isCopied ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadAsset(asset)}
                    className="rounded-md border border-primary/35 bg-transparent px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-wide text-primary transition-all hover:bg-primary/10"
                  >
                    Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div id="generated-assets-section" className="mb-12 animate-[fadeIn_0.5s_ease]">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[1.55rem] font-extrabold text-primary md:text-[1.8rem]">Generated Knowledge Assets</h3>
        <span className="rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-[0.67rem] font-bold uppercase tracking-[0.12em] text-primary">
          Latest first
        </span>
      </div>
      <div>
        {assets.map((asset, index) => {
          const assetKey = `${asset.type}-${asset.timestamp}`;
          const isCopied = copiedAssetKey === assetKey;
          return (
            <div
              key={`${asset.type}-${asset.timestamp}-${index}`}
              className="mb-5 animate-[slideIn_0.5s_ease] rounded-2xl border border-primary/35 bg-card/55 p-6 transition-all hover:-translate-y-0.5 hover:shadow-elegant"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-5">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-3xl">{asset.icon}</div>
                  <div className="min-w-0">
                    <h4 className="mb-1 text-[1.25rem] font-bold text-foreground md:text-[1.4rem]">{asset.title}</h4>
                    <p className="font-mono text-[0.78rem] text-muted-foreground">Generated: {asset.timestamp}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => viewAsset(asset)}
                    className="rounded-lg bg-primary px-6 py-2.5 text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-primary-foreground transition-all hover:bg-primary-glow hover:shadow-elegant"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => copyAsset(asset)}
                    className="rounded-lg border border-primary px-6 py-2.5 text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-primary transition-all hover:bg-primary/10"
                  >
                    {isCopied ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadAsset(asset)}
                    className="rounded-lg border border-primary px-6 py-2.5 text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-primary transition-all hover:bg-primary/10"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
