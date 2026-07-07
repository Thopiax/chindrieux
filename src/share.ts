// WhatsApp share deep link: opens the chat picker with a prefilled message.
export function waShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

// The app's own URL without any hash route, ready to paste into an invite.
export function appUrl(): string {
  return location.origin + location.pathname
}
