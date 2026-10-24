import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Reblet",
  description: "Learn how Reblet collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link
          href="/"
          className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          &larr; Back to home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: October 24, 2026</p>

        <div className="flex flex-col gap-8 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Introduction</h2>
            <p>
              Reblet (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the website reblet.com. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Information We Collect</h2>
            <p className="mb-3">We may collect the following types of information:</p>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li><strong>Account information:</strong> When you sign in with Google, we receive your name, email address, and profile picture.</li>
              <li><strong>Application data:</strong> When you apply for a job through Reblet, we collect your resume, cover letter or notes, and any other information you provide in the application form.</li>
              <li><strong>Company information:</strong> If you register as an employer, we collect your company name, logo, description, location, and website.</li>
              <li><strong>Usage data:</strong> We automatically collect information about how you interact with our website, including pages visited, time spent, and browser information.</li>
              <li><strong>Cookies:</strong> We use cookies and similar tracking technologies to improve your experience and analyze site usage.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>To provide and maintain our job board service</li>
              <li>To process and deliver your job applications to employers</li>
              <li>To allow employers to review applications and manage job postings</li>
              <li>To communicate with you about your account or applications</li>
              <li>To improve our website and user experience</li>
              <li>To display relevant advertisements through Google AdSense</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Information Sharing</h2>
            <p className="mb-3">We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li><strong>Employers:</strong> When you apply for a job, your application details (name, email, resume, and notes) are shared with the hiring company.</li>
              <li><strong>Service providers:</strong> We use third-party services including Google (authentication and analytics), Cloudflare (file storage), MongoDB (database), and Vercel (hosting).</li>
              <li><strong>Advertising partners:</strong> We use Google AdSense, which may use cookies to serve ads based on your browsing activity. You can opt out at <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-gray-800 underline hover:text-gray-600">Google Ads Settings</a>.</li>
              <li><strong>Legal requirements:</strong> We may disclose your information if required by law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">5. Data Storage & Security</h2>
            <p>
              Your data is stored securely using MongoDB Atlas and Cloudflare R2. We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">6. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt out of marketing communications</li>
              <li>Withdraw consent for data processing</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:rayandteamsupport@gmail.com" className="text-gray-800 underline hover:text-gray-600">
                rayandteamsupport@gmail.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">7. Cookies</h2>
            <p>
              We use essential cookies to keep you signed in and functional cookies to remember your preferences. Third-party cookies from Google AdSense and Vercel Analytics may also be used. You can manage cookie preferences through your browser settings or our cookie consent banner.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">8. Children&apos;s Privacy</h2>
            <p>
              Our service is not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{" "}
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
