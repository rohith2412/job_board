import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Reblet",
  description: "Read the terms and conditions for using Reblet's job board services.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link
          href="/"
          className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          &larr; Back to home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: October 24, 2026</p>

        <div className="flex flex-col gap-8 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Reblet (reblet.com), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Description of Service</h2>
            <p>
              Reblet is a curated job board that connects software engineers with employers in the United States and Canada. We provide job listings, application tools, and employer posting features. We act as a platform and are not a party to any employment relationship.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>You may sign in using Google authentication. You are responsible for maintaining the security of your account.</li>
              <li>You must provide accurate and complete information when using our services.</li>
              <li>You may not use another person&apos;s account without permission.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Job Seekers</h2>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>You may browse job listings and apply through Reblet free of charge.</li>
              <li>You are responsible for the accuracy of information in your applications, including your resume and cover letter.</li>
              <li>Submitting an application does not guarantee employment or a response from the employer.</li>
              <li>Reblet is not responsible for hiring decisions made by employers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">5. Employers</h2>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>Employers may create company profiles and post job listings through Reblet.</li>
              <li>All job postings must be for legitimate, legal employment opportunities.</li>
              <li>Employers must not post misleading, discriminatory, or fraudulent job listings.</li>
              <li>Employers are responsible for complying with all applicable employment laws and regulations.</li>
              <li>We reserve the right to remove any job posting that violates these terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">6. Prohibited Conduct</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>Use the service for any unlawful purpose</li>
              <li>Scrape, crawl, or use automated tools to access the service without our written consent</li>
              <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
              <li>Upload malicious content, viruses, or harmful code</li>
              <li>Harass, spam, or abuse other users</li>
              <li>Post false or misleading information</li>
              <li>Interfere with the proper functioning of the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">7. Intellectual Property</h2>
            <p>
              The Reblet name, logo, and website design are our property. Job listings may contain content from third-party sources. You retain ownership of any content you submit (resumes, applications, job postings) but grant us a license to use it for the purpose of providing our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">8. Disclaimer of Warranties</h2>
            <p>
              Reblet is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free. We do not verify the accuracy of job listings or employer information and are not responsible for the content of third-party job postings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Reblet shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service, including but not limited to loss of employment opportunities, data, or revenue.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">10. Changes to Terms</h2>
            <p>
              We may update these Terms of Service at any time. Continued use of the service after changes constitutes acceptance of the new terms. We will update the &quot;Last updated&quot; date when changes are made.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">11. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:rayandteamsupport@gmail.com" className="text-gray-800 underline hover:text-gray-600">
                rayandteamsupport@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
