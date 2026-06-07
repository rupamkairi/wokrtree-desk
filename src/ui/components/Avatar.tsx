import { useEffect, useState } from "react";

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Shows a real Gravatar photo for an email if one exists (d=404 → no generated
 * identicon). Renders nothing when there is no email or no real avatar; callers
 * always show the author name beside it.
 */
export function Avatar({
  email,
  name,
  size = 20,
}: {
  email: string;
  name: string;
  size?: number;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setUrl(null);
    if (!email) {
      return;
    }
    void sha256Hex(email).then((hex) => {
      if (!cancelled) {
        setUrl(`https://www.gravatar.com/avatar/${hex}?d=404&s=${size * 2}`);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [email, size]);

  if (!url || failed) {
    return null;
  }

  return (
    <img
      src={url}
      width={size}
      height={size}
      alt={name}
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full border border-border object-cover"
      style={{ width: size, height: size }}
    />
  );
}
