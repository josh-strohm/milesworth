export function Reports() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">IRS Report</h2>
        <p className="text-gray-400 text-sm mb-4">Generate a PDF report with your total miles by category for tax filing.</p>
        <button disabled className="bg-dark-600 text-gray-500 font-medium py-2 px-4 rounded-lg cursor-not-allowed">Coming in Week 2</button>
      </div>
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Quarterly Tax Export</h2>
        <p className="text-gray-400 text-sm mb-4">Download a CSV with monthly miles and estimated deductions for quarterly tax payments.</p>
        <button disabled className="bg-dark-600 text-gray-500 font-medium py-2 px-4 rounded-lg cursor-not-allowed">Coming in Week 2</button>
      </div>
    </div>
  );
}
