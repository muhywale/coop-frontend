import React from "react";
import Card from "./ui/Card";
import { whatsappLink, telLink } from "../utils/contact";

const linkClass =
  "inline-block border border-gray-300 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50";

function ContactCard({ contact, member }) {
  if (!contact || (!contact.phone && !contact.whatsapp)) return null;

  const greeting = `Hello, this is ${member.full_name}${member.member_number ? ` (member no. ${member.member_number})` : ""}.`;
  const wa = whatsappLink(contact.whatsapp, greeting);
  const tel = telLink(contact.phone);

  return (
    <Card>
      <h3 className="font-semibold mb-1">Contact your cooperative</h3>
      <p className="text-sm text-gray-500 mb-3">
        Questions about a payment, a balance or a loan? Reach your admin here.
      </p>
      <div className="flex flex-wrap gap-3">
        {tel && (
          <a href={tel} className={linkClass}>
            Call {contact.phone}
          </a>
        )}
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Message on WhatsApp
          </a>
        )}
      </div>
    </Card>
  );
}

export default ContactCard;
