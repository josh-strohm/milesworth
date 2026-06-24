import { Link } from 'react-router-dom';
import { IRS_BUSINESS_RATE, IRS_YEAR } from '@/config/irs-rate';

export function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-dark-700">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-lg font-bold text-brand-500">MilesWorth</span>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">Sign in</Link>
            <Link to="/signup" className="text-sm bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg transition-colors">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Stop losing money on<br />
          <span className="text-brand-500">unlogged business miles</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
          MilesWorth auto-logs your business drives and generates IRS-ready reports at tax time.
          Privacy-first. Works offline. Built for self-employed workers.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Link to="/signup" className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors text-lg">
            Start free trial
          </Link>
          <a href="#pricing" className="border border-dark-600 hover:border-dark-500 text-gray-300 font-medium py-3 px-8 rounded-xl transition-colors">
            See pricing
          </a>
        </div>
        <p className="text-sm text-gray-500">
          {IRS_YEAR} IRS rate: ${IRS_BUSINESS_RATE}/mile · 5 free trips/month · No credit card required
        </p>
      </section>

      {/* Problem */}
      <section className="bg-dark-900 py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">The average tradesperson misses <span className="text-red-400">$3,770/year</span> in deductions</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Driving 100 business miles/week and not logging them? That's {IRS_BUSINESS_RATE * 100 * 52} in deductions
            you're leaving on the table every year. MilesWorth makes sure you never miss a mile.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-3">📍</div>
            <h3 className="font-semibold mb-2">Start your trip</h3>
            <p className="text-gray-400 text-sm">Tap "Start Trip" before you drive. MilesWorth captures your GPS location in the foreground.</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🚗</div>
            <h3 className="font-semibold mb-2">Drive normally</h3>
            <p className="text-gray-400 text-sm">No background tracking. No battery drain. Just do your work.</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">📄</div>
            <h3 className="font-semibold mb-2">Get your report</h3>
            <p className="text-gray-400 text-sm">At tax time, generate an IRS-ready PDF with your total miles by category. Done.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-dark-900 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">Built for self-employed workers</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              ['Privacy-first', 'Your trips stay in your account. No bank linking. No ads.'],
              ['Works offline', 'Log trips in dead zones. Syncs when you reconnect.'],
              ['GPS auto-detect', 'Start trip, drive, end trip. Distance calculated automatically.'],
              ['Manual entry', 'Prefer to type it in? Full manual entry with categories.'],
              ['IRS-ready PDF', 'One-click reports with totals by category, vehicle, and date range.'],
              ['Quarterly CSV', 'Export monthly deductions for estimated tax payments.'],
            ].map(([title, desc]) => (
              <div key={title} className="bg-dark-800 rounded-xl p-5 border border-dark-700">
                <h3 className="font-semibold text-gray-100 mb-1">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold text-center mb-4">Simple pricing</h2>
        <p className="text-gray-400 text-center mb-12">Less than a fast-food lunch per month. Pays for itself in 8 miles.</p>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Free */}
          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <h3 className="font-semibold text-gray-300 mb-1">Free</h3>
            <p className="text-3xl font-bold mb-1">$0</p>
            <p className="text-gray-500 text-sm mb-6">forever</p>
            <ul className="space-y-2 text-sm text-gray-400 mb-6">
              <li>✓ 5 trips/month</li>
              <li>✓ Manual trip entry</li>
              <li>✓ IRS PDF report</li>
              <li>✓ Quarterly CSV</li>
              <li className="text-gray-600">✗ GPS auto-detect</li>
              <li className="text-gray-600">✗ Unlimited trips</li>
            </ul>
            <Link to="/signup" className="block text-center border border-dark-600 hover:border-dark-500 text-gray-300 font-medium py-2.5 rounded-lg transition-colors">
              Get started
            </Link>
          </div>

          {/* Monthly */}
          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <h3 className="font-semibold text-gray-300 mb-1">Monthly</h3>
            <p className="text-3xl font-bold mb-1">$5<span className="text-base font-normal text-gray-500">/mo</span></p>
            <p className="text-gray-500 text-sm mb-6">7-day free trial</p>
            <ul className="space-y-2 text-sm text-gray-400 mb-6">
              <li>✓ Unlimited trips</li>
              <li>✓ GPS auto-detect</li>
              <li>✓ Manual trip entry</li>
              <li>✓ IRS PDF report</li>
              <li>✓ Quarterly CSV</li>
              <li>✓ All vehicles</li>
            </ul>
            <Link to="/signup" className="block text-center bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg transition-colors">
              Start free trial
            </Link>
          </div>

          {/* Yearly */}
          <div className="bg-dark-800 rounded-xl p-6 border border-brand-600/50 relative">
            <span className="absolute -top-3 right-4 text-xs bg-brand-600 text-white px-3 py-1 rounded-full">Best value</span>
            <h3 className="font-semibold text-gray-300 mb-1">Yearly</h3>
            <p className="text-3xl font-bold mb-1">$39<span className="text-base font-normal text-gray-500">/yr</span></p>
            <p className="text-gray-500 text-sm mb-6">Save 35% · $3.25/mo</p>
            <ul className="space-y-2 text-sm text-gray-400 mb-6">
              <li>✓ Unlimited trips</li>
              <li>✓ GPS auto-detect</li>
              <li>✓ Manual trip entry</li>
              <li>✓ IRS PDF report</li>
              <li>✓ Quarterly CSV</li>
              <li>✓ All vehicles</li>
            </ul>
            <Link to="/signup" className="block text-center bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg transition-colors">
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-dark-900 py-16">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              ['Does this work on iPhone?', 'Yes. MilesWorth is a PWA that works on any phone with a browser. Install it as a home screen app for the best experience. GPS works in the foreground while the app is open.'],
              ['What about background tracking?', "iOS doesn\u2019t reliably support background GPS for web apps. We use foreground tracking instead. Open the app, tap Start Trip, and drive. It\u2019s honest and it works."],
              ['Is my data private?', 'Absolutely. Your trips are stored in your account only. We never see them in a human-readable way. No bank linking. No ads. No upsells. Cancel anytime.'],
              ['What IRS rate do you use?', `The ${IRS_YEAR} standard business mileage rate of $${IRS_BUSINESS_RATE}/mile. This updates automatically each January when the IRS publishes the new rate.`],
              ['Can I export for my accountant?', 'Yes. Generate an IRS-ready PDF report with totals by category, vehicle, and date range. You can also export a CSV with monthly breakdowns for quarterly estimated taxes.'],
              ['Can I cancel anytime?', 'Yes. Cancel from the billing portal in your settings. You keep access until the end of your billing period. No questions asked.'],
            ].map(([q, a]) => (
              <div key={q} className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                <h3 className="font-semibold text-gray-200 mb-1">{q}</h3>
                <p className="text-gray-400 text-sm">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Start logging your miles today</h2>
        <p className="text-gray-400 mb-8">Free forever. Upgrade when you're ready.</p>
        <Link to="/signup" className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors text-lg inline-block">
          Get started free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-700 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-bold text-brand-500">MilesWorth</span>
            <span className="text-gray-600 text-sm">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-gray-300 transition-colors">Terms</Link>
            <a href="mailto:support@milesworth.io" className="hover:text-gray-300 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
