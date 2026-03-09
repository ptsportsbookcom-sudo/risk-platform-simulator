// Compliance domain module
// Would handle KYC / CDD / affordability and regulatory controls.

export function getComplianceSummary() {
  return {
    pendingKyc: 2,
    failedKyc: 1,
    enhancedCdd: 2,
  };
}

