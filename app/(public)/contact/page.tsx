import { getBusinessPublic } from "@/lib/business-public";
import { ContactForm } from "./ContactForm";
import { ContactMap } from "./ContactMap";

export default async function ContactPage() {
  const business = await getBusinessPublic();
  return (
    <>
      <ContactForm />
      <ContactMap googleMapsUrl={business.googleMapsUrl} />
    </>
  );
}
