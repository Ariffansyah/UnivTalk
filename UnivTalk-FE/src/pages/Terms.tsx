import React from "react";
import { Link } from "react-router-dom";

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-12">
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors cursor-pointer mb-4"
            >
              ← Back to Home
            </Link>
            <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
              Terms of Service
            </h1>
            <p className="text-gray-500 text-sm">
              Last updated: December 14, 2025
            </p>
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📜 Agreement to Terms
              </h2>
              <p>
                By accessing or using UnivTalk, you agree to be bound by these
                Terms of Service and all applicable laws and regulations. If you
                do not agree with any of these terms, you are prohibited from
                using or accessing this platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                👤 User Accounts
              </h2>
              <p className="mb-3">When creating an account on UnivTalk: </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You must provide accurate and complete information</li>
                <li>
                  You are responsible for maintaining the security of your
                  account
                </li>
                <li>You must be at least 13 years old to use this service</li>
                <li>
                  You are responsible for all activities that occur under your
                  account
                </li>
                <li>
                  You must notify us immediately of any unauthorized use of your
                  account
                </li>
                <li>One person may only maintain one account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ✅ Acceptable Use
              </h2>
              <p className="mb-3">
                You agree to use UnivTalk only for lawful purposes. You agree
                NOT to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Post or share content that is illegal, harmful, threatening,
                  abusive, or offensive
                </li>
                <li>Harass, bully, or intimidate other users</li>
                <li>
                  Impersonate any person or entity or misrepresent your
                  affiliation
                </li>
                <li>
                  Share spam, advertisements, or promotional content without
                  permission
                </li>
                <li>Upload viruses, malware, or any malicious code</li>
                <li>
                  Attempt to gain unauthorized access to our systems or other
                  user accounts
                </li>
                <li>Scrape, copy, or download content using automated means</li>
                <li>Share false or misleading information</li>
                <li>Violate any intellectual property rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📝 User Content
              </h2>
              <p className="mb-3">Regarding content you post on UnivTalk:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You retain ownership of content you create and post</li>
                <li>
                  You grant UnivTalk a license to use, display, and distribute
                  your content on the platform
                </li>
                <li>You are solely responsible for the content you post</li>
                <li>
                  We reserve the right to remove any content that violates these
                  terms
                </li>
                <li>
                  We do not endorse any user content and are not responsible for
                  its accuracy
                </li>
                <li>You must have the right to post any content you share</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🎓 Academic Integrity
              </h2>
              <p>
                UnivTalk is designed to facilitate academic discussion and
                collaboration. However, users must maintain academic integrity.
                Do not use this platform to engage in academic dishonesty,
                including sharing assignment answers, exam questions, or any
                form of cheating.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ⚖️ Intellectual Property
              </h2>
              <p>
                The UnivTalk platform, including its design, features, code, and
                branding, is protected by copyright and other intellectual
                property laws. You may not copy, modify, distribute, or create
                derivative works without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🚫 Moderation and Enforcement
              </h2>
              <p className="mb-3">We reserve the right to: </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Remove any content that violates these terms</li>
                <li>Suspend or terminate accounts that violate these terms</li>
                <li>Modify or discontinue any aspect of the service</li>
                <li>Investigate and take action against violations</li>
                <li>Cooperate with law enforcement when necessary</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ⚠️ Disclaimers
              </h2>
              <p className="mb-3">Please note: </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  UnivTalk is provided "as is" without warranties of any kind
                </li>
                <li>We do not guarantee uninterrupted or error-free service</li>
                <li>We are not responsible for user-generated content</li>
                <li>
                  We are not liable for any decisions made based on information
                  found on the platform
                </li>
                <li>
                  Academic advice shared by users should not replace official
                  institutional guidance
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🛡️ Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by law, UnivTalk and its
                developers shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages, or any loss of
                profits or revenues, whether incurred directly or indirectly, or
                any loss of data, use, or other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🔄 Changes to Terms
              </h2>
              <p>
                We reserve the right to modify these Terms of Service at any
                time. We will notify users of any material changes by posting
                the new terms on this page and updating the "Last updated" date.
                Your continued use of UnivTalk after changes constitutes
                acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🔚 Termination
              </h2>
              <p>
                You may terminate your account at any time by contacting us. We
                may terminate or suspend your account immediately, without prior
                notice, if you breach these Terms of Service. Upon termination,
                your right to use the platform will cease immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ⚖️ Governing Law
              </h2>
              <p>
                These Terms shall be governed and construed in accordance with
                applicable laws, without regard to its conflict of law
                provisions. Our failure to enforce any right or provision of
                these Terms will not be considered a waiver of those rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📧 Contact Us
              </h2>
              <p className="mb-3">
                If you have any questions about these Terms of Service, please
                contact us:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="font-semibold text-gray-800">
                  Email: contact@univtalk.id
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  We will respond to your inquiry within 48 hours
                </p>
              </div>
            </section>

            <section className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 italic">
                By using UnivTalk, you acknowledge that you have read,
                understood, and agree to be bound by these Terms of Service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
