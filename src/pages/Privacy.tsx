import { Link } from 'react-router-dom';

export function Privacy() {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-dark-700">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-brand-500">MilesWorth</Link>
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-200">Back to home</Link>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-4 py-12 prose prose-invert prose-sm">
        <h1>Privacy Policy</h1>
        <p className="text-gray-400">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <h2>What we collect</h2>
        <p>MilesWorth collects the information you provide directly: your email address, name, vehicle information, and trip logs (dates, addresses, distances, categories). We also collect basic account information through Supabase Auth (email, name if you sign up with Google).</p>

        <h2>What we never do</h2>
        <ul>
          <li>We never link to your bank accounts or credit cards.</li>
          <li>We never sell your data to third parties.</li>
          <li>We never show ads.</li>
          <li>We never read your trips in a human-readable way for any purpose other than displaying them to you.</li>
          <li>We never share your data with insurance companies, employers, or anyone else.</li>
        </ul>

        <h2>How your data is stored</h2>
        <p>Your data is stored in Supabase, a hosted PostgreSQL database. Each user's data is isolated through Row Level Security (RLS) policies. Only you can access your trips, vehicles, and profile. Our servers cannot read your data without your authentication.</p>

        <h2>GPS and location data</h2>
        <p>When you use the "Start Trip" feature, your phone's GPS provides coordinates to calculate distance. This data is stored with your trip record and is never shared with anyone. We do not track your location in the background.</p>

        <h2>Payment processing</h2>
        <p>Payments are processed by Stripe. We do not store your credit card number. Stripe's privacy policy applies to payment data: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a>.</p>

        <h2>Data deletion</h2>
        <p>You can delete your account and all associated data at any time from the Settings page. Deleted data cannot be recovered. You can also request data deletion by emailing support@milesworth.io.</p>

        <h2>Changes to this policy</h2>
        <p>We may update this policy occasionally. If we make significant changes, we'll notify you by email. The "Last updated" date at the top will always reflect the current version.</p>

        <h2>Contact</h2>
        <p>Questions about this policy? Email us at support@milesworth.io.</p>
      </div>
    </div>
  );
}
