import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-mid-grey hover:text-dark-grey mb-8 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
        <div className="card">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            <img src="/logo.png" alt="AGS Tutorial" className="h-12 w-12 object-contain rounded-xl" />
            <div>
              <h1 className="text-2xl font-extrabold text-dark-grey">Privacy Policy</h1>
              <p className="text-sm text-mid-grey">AGS Tutorial · Last updated: April 2025</p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-dark-grey space-y-6">
            {[
              {
                title: '1. Information We Collect',
                content: `We collect personal information that you provide to us, including but not limited to: student name, parent/guardian name, phone number, email address, class details, and fee payment records. We also collect information submitted through our contact form.`
              },
              {
                title: '2. How We Use Your Information',
                content: `Your information is used to: manage student enrollment and records, process fee payments, send communications regarding your child's education, generate fee receipts, and improve our services. We do not sell or share your personal information with third parties except as required by law.`
              },
              {
                title: '3. Data Storage & Security',
                content: `All data is stored securely on encrypted cloud servers. We use industry-standard security measures including HTTPS, JWT authentication, bcrypt password hashing, and role-based access control. Only authorized staff (admin and teachers) can access student records.`
              },
              {
                title: '4. Payment Security',
                content: `Online fee payments are processed through Razorpay, a PCI-DSS compliant payment gateway. We do not store your card or bank details on our servers. All payment transactions are encrypted and secured by Razorpay's security systems.`
              },
              {
                title: '5. Cookies',
                content: `We use minimal cookies and local storage to maintain your login session. These are essential for the functioning of our portal and do not track you across other websites. Session data is automatically cleared when you log out or after 8 hours.`
              },
              {
                title: '6. Data Retention',
                content: `Student records and payment history are retained for 7 years as required for educational and financial record-keeping. Contact form submissions are retained for 1 year. You may request deletion of your data by contacting us at agstutorial050522@gmail.com.`
              },
              {
                title: '7. Children\'s Privacy',
                content: `We are committed to protecting the privacy of children. All student data is managed by authorized adults (parents, guardians, or school staff). We do not directly collect information from children under 13 without parental consent.`
              },
              {
                title: '8. Your Rights',
                content: `You have the right to access, correct, or delete your personal information. You may also request a copy of the data we hold about you. To exercise these rights, contact us at agstutorial050522@gmail.com or call 9839910481.`
              },
              {
                title: '9. Changes to This Policy',
                content: `We may update this Privacy Policy periodically. Any changes will be posted on this page with an updated date. Continued use of our portal after changes constitutes acceptance of the updated policy.`
              },
              {
                title: '10. Contact Us',
                content: `If you have any questions about this Privacy Policy or our data practices, please contact us:\n\nAGS Tutorial\nA-353, Gali No 8, Part 2, Pusta 1, Sonia Vihar, Delhi\nPhone: 9839910481\nEmail: agstutorial050522@gmail.com`
              },
            ].map((section, i) => (
              <div key={i}>
                <h2 className="text-base font-bold text-dark-grey mb-2">{section.title}</h2>
                <p className="text-mid-grey text-sm leading-relaxed whitespace-pre-line">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
