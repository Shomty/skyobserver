import { LegalSection, LegalShell } from './LegalShell';

const LAST_UPDATED = '25 July 2026';

export default function PrivacyPolicyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      description="How Vedic Sky Observer collects, uses, stores, and deletes your birth details, email, and chart data."
      path="/privacy"
      lastUpdated={LAST_UPDATED}
    >
      <p>
        Vedic Sky Observer calculates astrological charts from your birth details. Those details are
        personal data, and some people consider them sensitive. This page explains exactly what we
        collect, why, who else sees it, and how to get it deleted.
      </p>

      <LegalSection heading="What we collect">
        <p>
          <strong>Birth details.</strong> Your name and salutation, birth date, birth time, and birth
          place. When you choose a place from the suggestions, we also store its coordinates and
          timezone — a chart cannot be calculated without them.
        </p>
        <p>
          <strong>Contact details.</strong> Your email address, so we can send your report and the
          link that confirms your request.
        </p>
        <p>
          <strong>Anything optional you choose to add.</strong> Interest area, experience level,
          relationship status, number of children, work status, occupation, social handle, and free
          notes. Every one of these is optional and skipping them does not change whether you receive
          your report.
        </p>
        <p>
          <strong>Technical data.</strong> Your IP address, browser user agent, the referring page,
          and any campaign parameters (<code>utm_source</code> and similar) in the link you arrived
          through. We also record how long a form took to fill in, purely to detect automated
          submissions.
        </p>
      </LegalSection>

      <LegalSection heading="Why we collect it">
        <p>
          To calculate your chart and produce the reading you asked for; to email it to you; to
          confirm that the email address belongs to you; to protect the service from bots and abuse;
          and to understand which parts of the site people find useful.
        </p>
        <p>
          Where you gave consent (the checkbox on the request form), you may withdraw it at any time.
          Withdrawing consent does not affect processing that already happened.
        </p>
      </LegalSection>

      <LegalSection heading="Who else processes it">
        <p>
          <strong>Google Firebase</strong> — authentication and database hosting, where account and
          chart data is stored.
        </p>
        <p>
          <strong>Google Gemini</strong> — generates written interpretations. The chart data needed
          for the interpretation is sent to this service.
        </p>
        <p>
          <strong>Open-Meteo</strong> — converts a place name into coordinates and a timezone. Only
          the place name you type is sent; your other details are not.
        </p>
        <p>
          We do not sell your data, and we do not share it with advertisers or data brokers.
        </p>
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <p>
          Until you ask us to delete it. Email <a href="mailto:hello@vedicsky.app">hello@vedicsky.app</a>{' '}
          from the address you signed up with and we will remove your data and confirm when it is
          done.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          You can ask for a copy of your data, correct it, have it deleted, receive it in a portable
          format, object to how we use it, or withdraw consent. Write to{' '}
          <a href="mailto:hello@vedicsky.app">hello@vedicsky.app</a>. If you are in the EU or the UK
          and you are unhappy with our response, you may complain to your national data protection
          authority.
        </p>
      </LegalSection>

      <LegalSection heading="Storage in your browser">
        <p>
          While you fill in a request form, your answers are held in your browser's{' '}
          <code>sessionStorage</code> so a refresh does not lose them. That storage is cleared when
          you close the tab, and we deliberately do not use <code>localStorage</code> for it. Your
          light/dark theme preference is stored locally and contains no personal data. We do not use
          advertising or third-party tracking cookies.
        </p>
      </LegalSection>

      <LegalSection heading="Age">
        <p>
          The service is for people aged 18 and over. We do not knowingly collect data from children.
          If you believe a child has submitted their details, contact us and we will delete them.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          If this policy changes materially, we will update the date at the top of this page and, for
          changes that affect how we use data you already gave us, tell you by email.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
