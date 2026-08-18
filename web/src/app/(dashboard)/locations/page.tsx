import { redirect } from "next/navigation";

// The Locations tab was folded into the Overview page's location cards —
// this base path only exists to send stale links/bookmarks somewhere sane.
export default function LocationsIndexRedirect() {
  redirect("/overview");
}
