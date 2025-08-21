import { SEO } from '@/components/SEO';
import { LegalLayout } from '@/components/layout/LegalLayout';

export default function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy - FindableAI"
        description="Learn how FindableAI protects your privacy and handles your personal information. Transparent data practices for our AI-powered SEO platform."
        url={typeof window !== 'undefined' ? window.location.href : 'https://findable.ai/privacy'}
      />
      
      <LegalLayout title="Privacy Policy">
        <section>
          <h2 id="information-we-collect">Information We Collect</h2>
          <p>
            We collect information to provide better services to all our users. The types of information 
            we collect include:
          </p>
          
          <h3 id="personal-information">Personal Information</h3>
          <p>
            When you create an account or use our services, we collect personal information such as:
          </p>
          <ul>
            <li>Name and email address</li>
            <li>Payment information for subscription services</li>
            <li>Website URLs you submit for analysis</li>
            <li>Communication preferences</li>
          </ul>

          <h3 id="usage-data">Usage Data</h3>
          <p>
            We automatically collect information about how you use our services, including:
          </p>
          <ul>
            <li>Website scan results and AI prompt interactions</li>
            <li>Feature usage and performance metrics</li>
            <li>Log files and analytics data</li>
            <li>Device and browser information</li>
          </ul>
        </section>

        <section>
          <h2 id="how-we-use-information">How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul>
            <li>Provide, maintain, and improve our AI findability services</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send important updates about your account and services</li>
            <li>Respond to your questions and provide customer support</li>
            <li>Detect fraud and ensure platform security</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 id="information-sharing">Information Sharing</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personal information to outside parties except:
          </p>
          <ul>
            <li>With your explicit consent</li>
            <li>To trusted service providers who assist in operating our platform</li>
            <li>When required by law or to protect our rights</li>
            <li>In connection with a business transfer or acquisition</li>
          </ul>
        </section>

        <section>
          <h2 id="data-security">Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information, including:
          </p>
          <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security audits and monitoring</li>
            <li>Access controls and authentication requirements</li>
            <li>Secure data centers and infrastructure</li>
          </ul>
        </section>

        <section>
          <h2 id="your-rights">Your Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal information:
          </p>
          <ul>
            <li>Access and portability of your data</li>
            <li>Correction of inaccurate information</li>
            <li>Deletion of your account and associated data</li>
            <li>Restriction of processing in certain circumstances</li>
            <li>Objection to processing for marketing purposes</li>
          </ul>
          <p>
            To exercise these rights, please contact us at{' '}
            <a href="mailto:privacy@findable.ai" className="text-primary hover:underline">
              privacy@findable.ai
            </a>
          </p>
        </section>

        <section>
          <h2 id="data-retention">Data Retention</h2>
          <p>
            We retain your information for as long as your account is active or as needed to provide services. 
            We may also retain and use your information to comply with legal obligations, resolve disputes, 
            and enforce our agreements.
          </p>
        </section>

        <section>
          <h2 id="international-transfers">International Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own. 
            We ensure appropriate safeguards are in place to protect your information during such transfers.
          </p>
        </section>

        <section>
          <h2 id="children-privacy">Children's Privacy</h2>
          <p>
            Our services are not directed to individuals under the age of 13. We do not knowingly collect 
            personal information from children under 13. If we become aware of such collection, we will 
            delete the information immediately.
          </p>
        </section>

        <section>
          <h2 id="changes-to-policy">Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes by 
            posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h2 id="contact-us">Contact Us</h2>
          <p>
            If you have any questions about this privacy policy, please contact us:
          </p>
          <ul>
            <li>Email: <a href="mailto:privacy@findable.ai" className="text-primary hover:underline">privacy@findable.ai</a></li>
            <li>Address: FindableAI, 123 Tech Street, San Francisco, CA 94105</li>
          </ul>
        </section>
      </LegalLayout>
    </>
  );
}