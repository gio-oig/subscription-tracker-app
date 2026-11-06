import { useEffect, useState } from "react";

export default function useResendCooldown(seconds = 30) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const timeout = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(timeout);
  }, [remaining]);

  return {
    remaining,
    start: () => setRemaining(seconds),
  };
}
