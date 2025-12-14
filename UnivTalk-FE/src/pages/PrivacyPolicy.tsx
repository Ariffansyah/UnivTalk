import React from "react";
import { Link } from "react-router-dom";

const PrivacyPolicy: React.FC = () => {
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
              Privacy Policy
            </h1>
            <p className="text-gray-500 text-sm">
              Last updated: December 14, 2025
            </p>
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📋 Introduction
              </h2>
              <p>
                Welcome to UnivTalk. We respect your privacy and are committed
                to protecting your personal data. This privacy policy will
                inform you about how we look after your personal data when you
                visit our platform and tell you about your privacy rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📊 Information We Collect
              </h2>
              <p className="mb-3">
                We collect and process the following types of information:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Account Information:</strong> Username, email address,
                  and password (encrypted)
                </li>
                <li>
                  <strong>Profile Information:</strong> Any additional
                  information you choose to provide
                </li>
                <li>
                  <strong>Content:</strong> Posts, comments, forum discussions,
                  and media you upload
                </li>
                <li>
                  <strong>Usage Data:</strong> How you interact with our
                  platform, pages visited, and features used
                </li>
                <li>
                  <strong>Technical Data:</strong> IP address, browser type,
                  device information, and cookies
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🎯 How We Use Your Information
              </h2>
              <p className="mb-3">
                We use your information for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>To provide and maintain our service</li>
                <li>To manage your account and provide customer support</li>
                <li>To enable you to participate in forums and discussions</li>
                <li>To improve and personalize your experience</li>
                <li>To monitor usage and detect technical issues</li>
                <li>To send important notifications about your account</li>
                <li>To enforce our terms and conditions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🔒 Data Security
              </h2>
              <p>
                We implement appropriate technical and organizational security
                measures to protect your personal data against unauthorized
                access, alteration, disclosure, or destruction. However, no
                method of transmission over the internet is 100% secure, and we
                cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🤝 Data Sharing
              </h2>
              <p className="mb-3">
                We do not sell your personal data. We may share your information
                in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Public Content:</strong> Posts and comments you make
                  are visible to other users
                </li>
                <li>
                  <strong>Service Providers:</strong> Third-party services that
                  help us operate our platform
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law or
                  to protect our rights
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a
                  merger, sale, or acquisition
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🍪 Cookies
              </h2>
              <p>
                We use cookies and similar tracking technologies to track
                activity on our platform and store certain information. You can
                instruct your browser to refuse all cookies or to indicate when
                a cookie is being sent. However, if you do not accept cookies,
                you may not be able to use some features of our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                👤 Your Rights
              </h2>
              <p className="mb-3">
                You have the following rights regarding your personal data:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Access: </strong> Request a copy of your personal data
                </li>
                <li>
                  <strong>Correction:</strong> Update or correct your
                  information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your account
                  and data
                </li>
                <li>
                  <strong>Objection:</strong> Object to certain processing of
                  your data
                </li>
                <li>
                  <strong>Portability:</strong> Request transfer of your data to
                  another service
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                👶 Children's Privacy
              </h2>
              <p>
                Our service is not intended for users under the age of 13. We do
                not knowingly collect personal information from children under
                13. If you become aware that a child has provided us with
                personal data, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🔄 Changes to This Policy
              </h2>
              <p>
                We may update our Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the "Last updated" date. You are advised
                to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📧 Contact Us
              </h2>
              <p className="mb-3">
                If you have any questions about this Privacy Policy, please
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
                By using UnivTalk, you acknowledge that you have read and
                understood this Privacy Policy and agree to its terms.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
