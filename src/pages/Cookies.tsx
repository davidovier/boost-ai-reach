import { SEO } from '@/components/SEO';
import { LegalLayout } from '@/components/layout/LegalLayout';

export default function Cookies() {
  return (
    <>
      <SEO
        title="Cookie Policy - FindableAI"
        description="Learn about FindableAI's use of cookies and similar technologies to improve your experience on our AI-powered SEO platform."
        url={typeof window !== 'undefined' ? window.location.href : 'https://findable.ai/cookies'}
      />
      
      <LegalLayout title="Cookie Policy">
        <section>
          <h2 id="what-are-cookies">What Are Cookies</h2>
          <p>
            Cookies are small text files that are stored on your computer or mobile device when you 
            visit a website. They are widely used to make websites work more efficiently, as well as 
            to provide information to website owners.
          </p>
        </section>

        <section>
          <h2 id="how-we-use-cookies">How We Use Cookies</h2>
          <p>
            FindableAI uses cookies and similar technologies for various purposes:
          </p>
          
          <h3 id="essential-cookies">Essential Cookies</h3>
          <p>
            These cookies are necessary for the website to function properly. They enable core 
            functionality such as:
          </p>
          <ul>
            <li>User authentication and session management</li>
            <li>Security features and fraud prevention</li>
            <li>Load balancing and website performance</li>
            <li>Remembering your preferences and settings</li>
          </ul>

          <h3 id="analytics-cookies">Analytics Cookies</h3>
          <p>
            We use analytics cookies to understand how visitors interact with our website. 
            These cookies help us:
          </p>
          <ul>
            <li>Count visitors and measure website traffic</li>
            <li>Understand which pages are most popular</li>
            <li>Analyze user behavior and improve our services</li>
            <li>Track conversion rates and feature usage</li>
          </ul>

          <h3 id="functional-cookies">Functional Cookies</h3>
          <p>
            These cookies enhance your experience by remembering your choices and providing 
            personalized features:
          </p>
          <ul>
            <li>Language preferences and regional settings</li>
            <li>Theme preferences (light/dark mode)</li>
            <li>Dashboard customizations</li>
            <li>Recently viewed content</li>
          </ul>
        </section>

        <section>
          <h2 id="third-party-cookies">Third-Party Cookies</h2>
          <p>
            We may use third-party services that set cookies on our behalf:
          </p>
          
          <h3 id="payment-processing">Payment Processing</h3>
          <p>
            Our payment provider (Stripe) may set cookies to securely process payments and 
            prevent fraud.
          </p>

          <h3 id="authentication">Authentication</h3>
          <p>
            Supabase, our authentication provider, uses cookies to manage user sessions 
            and security.
          </p>

          <h3 id="analytics-services">Analytics Services</h3>
          <p>
            We may use analytics services like Google Analytics or similar tools to understand 
            website usage patterns.
          </p>
        </section>

        <section>
          <h2 id="managing-cookies">Managing Cookies</h2>
          <h3 id="browser-controls">Browser Controls</h3>
          <p>
            Most web browsers allow you to control cookies through their settings preferences. 
            You can typically:
          </p>
          <ul>
            <li>View and delete existing cookies</li>
            <li>Block all cookies from all websites</li>
            <li>Block cookies from specific websites</li>
            <li>Block third-party cookies</li>
            <li>Clear all cookies when closing the browser</li>
          </ul>

          <h3 id="browser-instructions">Browser-Specific Instructions</h3>
          <p>
            For detailed instructions on managing cookies, please refer to your browser's help section:
          </p>
          <ul>
            <li>
              <a href="https://support.google.com/chrome/answer/95647" 
                 className="text-primary hover:underline" 
                 target="_blank" 
                 rel="noopener noreferrer">
                Google Chrome
              </a>
            </li>
            <li>
              <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" 
                 className="text-primary hover:underline" 
                 target="_blank" 
                 rel="noopener noreferrer">
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" 
                 className="text-primary hover:underline" 
                 target="_blank" 
                 rel="noopener noreferrer">
                Safari
              </a>
            </li>
            <li>
              <a href="https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies" 
                 className="text-primary hover:underline" 
                 target="_blank" 
                 rel="noopener noreferrer">
                Microsoft Edge
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 id="impact-of-disabling">Impact of Disabling Cookies</h2>
          <p>
            Please note that disabling cookies may affect your experience on our website:
          </p>
          <ul>
            <li>You may need to log in more frequently</li>
            <li>Some features may not work properly</li>
            <li>Your preferences may not be remembered</li>
            <li>Website performance may be reduced</li>
          </ul>
        </section>

        <section>
          <h2 id="local-storage">Local Storage and Similar Technologies</h2>
          <p>
            In addition to cookies, we may use other local storage technologies such as:
          </p>
          <ul>
            <li><strong>Local Storage:</strong> Stores data locally within your browser</li>
            <li><strong>Session Storage:</strong> Temporarily stores data for your browser session</li>
            <li><strong>IndexedDB:</strong> Stores larger amounts of structured data</li>
          </ul>
          <p>
            These technologies serve similar purposes to cookies and are subject to the same 
            privacy considerations.
          </p>
        </section>

        <section>
          <h2 id="data-retention">Data Retention</h2>
          <p>
            Different types of cookies have different retention periods:
          </p>
          <ul>
            <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
            <li><strong>Persistent cookies:</strong> Remain until their expiry date or you delete them</li>
            <li><strong>Our cookies typically expire:</strong> Between 30 days to 1 year</li>
          </ul>
        </section>

        <section>
          <h2 id="updates-to-policy">Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy from time to time to reflect changes in our practices 
            or applicable laws. We will notify you of any material changes by posting the updated 
            policy on our website.
          </p>
        </section>

        <section>
          <h2 id="contact-us">Contact Us</h2>
          <p>
            If you have any questions about our use of cookies, please contact us:
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