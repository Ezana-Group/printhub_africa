import { getBusinessPublic } from "@/lib/business-public";
import { ContactForm } from "./ContactForm";
import { ContactMap } from "./ContactMap";

export const dynamic = "force-dynamic"; // no DB at Docker build — render at request time

export default async function ContactPage() {
  const business = await getBusinessPublic();
  return (
    <>
      <ContactForm />
      <ContactMap googleMapsUrl={business.googleMapsUrl} />
    </>
  );
}
