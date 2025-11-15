// Client configuration - reads from environment variables
// For client components, use NEXT_PUBLIC_ prefix
// For server components, regular env vars work

export const appConfig = {
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || process.env.COMPANY_NAME || 'Enterprise Technologies',
  companyTagline: process.env.NEXT_PUBLIC_COMPANY_TAGLINE || process.env.COMPANY_TAGLINE || 'Enterprise Software Architecture & Infrastructure Solutions',
  companyEmail: process.env.NEXT_PUBLIC_COMPANY_EMAIL || process.env.COMPANY_EMAIL || 'info@example.com',
  companyWebsite: process.env.NEXT_PUBLIC_COMPANY_WEBSITE || process.env.COMPANY_WEBSITE || 'www.example.com',
};

