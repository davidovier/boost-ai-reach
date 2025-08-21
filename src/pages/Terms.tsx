import { SEO } from '@/components/SEO';
import { LegalLayout } from '@/components/layout/LegalLayout';

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms of Service - FindableAI"
        description="Read FindableAI's terms of service governing the use of our AI-powered SEO optimization platform and services."
        url={typeof window !== 'undefined' ? window.location.href : 'https://findable.ai/terms'}
      />
      
      <LegalLayout title="Terms of Service">
        <section>
          <h2 id="acceptance">Acceptance of Terms</h2>
          <p>
            By accessing or using FindableAI's services, you agree to be bound by these Terms of Service 
            and all applicable laws and regulations. If you do not agree with any of these terms, 
            you are prohibited from using our services.
          </p>
        </section>

        <section>
          <h2 id="description-of-service">Description of Service</h2>
          <p>
            FindableAI is an AI-powered platform that helps optimize websites for better discoverability 
            in AI search results and recommendations. Our services include:
          </p>
          <ul>
            <li>Website scanning and analysis</li>
            <li>AI prompt simulation and testing</li>
            <li>Competitor comparison and tracking</li>
            <li>SEO optimization recommendations</li>
            <li>Reporting and analytics tools</li>
          </ul>
        </section>

        <section>
          <h2 id="user-accounts">User Accounts</h2>
          <h3 id="registration">Registration</h3>
          <p>
            To use certain features of our service, you must register for an account. You agree to provide 
            accurate, current, and complete information during registration and to update such information 
            to keep it accurate, current, and complete.
          </p>

          <h3 id="account-security">Account Security</h3>
          <p>
            You are responsible for safeguarding your account credentials and for all activities that 
            occur under your account. You agree to notify us immediately of any unauthorized use of 
            your account.
          </p>
        </section>

        <section>
          <h2 id="subscription-and-billing">Subscription and Billing</h2>
          <h3 id="subscription-plans">Subscription Plans</h3>
          <p>
            We offer various subscription plans with different features and usage limits. Plan details 
            and pricing are available on our pricing page and may be updated from time to time.
          </p>

          <h3 id="billing-and-payment">Billing and Payment</h3>
          <p>
            Subscription fees are billed in advance on a monthly or annual basis. You authorize us to 
            charge your payment method for all fees owed. All fees are non-refundable unless otherwise 
            specified.
          </p>

          <h3 id="cancellation">Cancellation</h3>
          <p>
            You may cancel your subscription at any time. Cancellation will take effect at the end of 
            your current billing period. You will continue to have access to paid features until the 
            end of that period.
          </p>
        </section>

        <section>
          <h2 id="acceptable-use">Acceptable Use</h2>
          <p>
            You agree to use our services only for lawful purposes and in accordance with these Terms. 
            You agree not to:
          </p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others</li>
            <li>Transmit harmful, offensive, or inappropriate content</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Use our services to compete directly with us</li>
            <li>Exceed usage limits or abuse our resources</li>
          </ul>
        </section>

        <section>
          <h2 id="intellectual-property">Intellectual Property</h2>
          <h3 id="our-content">Our Content</h3>
          <p>
            The service and its original content, features, and functionality are owned by FindableAI 
            and are protected by international copyright, trademark, and other intellectual property laws.
          </p>

          <h3 id="your-content">Your Content</h3>
          <p>
            You retain ownership of content you submit to our services. By submitting content, you grant 
            us a limited license to use, process, and analyze such content to provide our services to you.
          </p>
        </section>

        <section>
          <h2 id="data-processing">Data Processing</h2>
          <p>
            Our services involve processing website data and content through AI systems. By using our 
            services, you acknowledge that:
          </p>
          <ul>
            <li>We may crawl and analyze publicly accessible web content</li>
            <li>AI processing results are algorithmic and may not always be accurate</li>
            <li>We implement security measures to protect processed data</li>
            <li>Processing is performed in accordance with our Privacy Policy</li>
          </ul>
        </section>

        <section>
          <h2 id="service-availability">Service Availability</h2>
          <p>
            We strive to maintain high service availability but do not guarantee uninterrupted access. 
            We may temporarily suspend access for maintenance, updates, or technical issues. We are not 
            liable for any losses resulting from service interruptions.
          </p>
        </section>

        <section>
          <h2 id="disclaimers">Disclaimers</h2>
          <p>
            Our services are provided "as is" and "as available" without warranties of any kind. We 
            disclaim all warranties, express or implied, including but not limited to warranties of 
            merchantability, fitness for a particular purpose, and non-infringement.
          </p>
        </section>

        <section>
          <h2 id="limitation-of-liability">Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, FindableAI shall not be liable for any indirect, 
            incidental, special, consequential, or punitive damages, including without limitation, 
            loss of profits, data, use, or other intangible losses.
          </p>
        </section>

        <section>
          <h2 id="indemnification">Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless FindableAI from any claims, damages, 
            obligations, losses, liabilities, costs, or debt arising from your use of our services 
            or violation of these Terms.
          </p>
        </section>

        <section>
          <h2 id="modifications">Modifications to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of any material 
            changes via email or through our service. Your continued use of the service after such 
            modifications constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 id="governing-law">Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State of 
            California, without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 id="contact-information">Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <ul>
            <li>Email: <a href="mailto:legal@findable.ai" className="text-primary hover:underline">legal@findable.ai</a></li>
            <li>Address: FindableAI, 123 Tech Street, San Francisco, CA 94105</li>
          </ul>
        </section>
      </LegalLayout>
    </>
  );
}