export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Corner",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://combatcoach.app",
    description: "Combat sports coaching marketplace connecting athletes with verified coaches.",
    sameAs: [],
  };
}

export function courseJsonLd(course: {
  title: string;
  shortDescription?: string;
  coach: { name: string };
  priceCents: number;
  discipline: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.shortDescription || course.title,
    provider: {
      "@type": "Organization",
      name: "Corner",
    },
    instructor: {
      "@type": "Person",
      name: course.coach.name,
    },
    offers: {
      "@type": "Offer",
      price: (course.priceCents / 100).toFixed(2),
      priceCurrency: "USD",
    },
    about: {
      "@type": "Thing",
      name: course.discipline.replace("-", " "),
    },
  };
}

export function personJsonLd(coach: {
  name: string;
  bio?: string;
  gym?: string;
  location?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: coach.name,
    description: coach.bio || "",
    jobTitle: "Combat Sports Coach",
    worksFor: coach.gym ? { "@type": "Organization", name: coach.gym } : undefined,
    address: coach.location ? { "@type": "PostalAddress", addressLocality: coach.location } : undefined,
  };
}
