import { redirect } from "next/navigation";

/** Addresses are managed under Settings only. Redirect old link. */
export default function AccountAddressesPage() {
  redirect("/account/settings/addresses");
}
