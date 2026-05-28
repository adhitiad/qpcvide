import { useEffect } from "react";

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.ctrlKey && e.key === 'Enter') {
          // Find closest form and submit
          const form = (e.target as HTMLElement).closest('form');
          if (form) {
            // Create a custom submit event to trigger React's onSubmit
            form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
          }
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          // Prevent scrolling for spacebar
          if (e.key === ' ') e.preventDefault();
          // Try to postMessage to iframes (often blocked by CORS but we try)
          document.querySelectorAll('iframe').forEach(iframe => {
            iframe.contentWindow?.postMessage('play-pause', '*');
            iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*'); // YouTube fallback format
          });
          break;
        case 'f':
          e.preventDefault();
          const player = document.getElementById('player-container');
          if (player) {
            if (!document.fullscreenElement) {
              player.requestFullscreen().catch(() => alert("Gunakan kontrol player internal untuk fullscreen."));
            } else {
              document.exitFullscreen();
            }
          }
          break;
        case 'm':
          document.querySelectorAll('iframe').forEach(iframe => {
            iframe.contentWindow?.postMessage('mute', '*');
          });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
