(function exposeUpdate(root) {
  const releaseApiUrl = 'https://api.github.com/repos/malyarq/market-trat/releases/latest';
  const latestReleaseUrl = 'https://github.com/malyarq/market-trat/releases/latest';
  const updateHelpUrl = 'https://github.com/malyarq/market-trat#%D0%BE%D0%B1%D0%BD%D0%BE%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D0%B5';

  function normalizeVersion(value) {
    return String(value || '').trim().replace(/^v/i, '');
  }

  function compareVersions(left, right) {
    const leftParts = normalizeVersion(left).split('.').map((part) => Number(part) || 0);
    const rightParts = normalizeVersion(right).split('.').map((part) => Number(part) || 0);
    const length = Math.max(leftParts.length, rightParts.length);

    for (let index = 0; index < length; index += 1) {
      const diff = (leftParts[index] || 0) - (rightParts[index] || 0);
      if (diff) return diff;
    }
    return 0;
  }

  function isNewerVersion(latest, current) {
    return compareVersions(latest, current) > 0;
  }

  const exported = {
    releaseApiUrl,
    latestReleaseUrl,
    updateHelpUrl,
    normalizeVersion,
    compareVersions,
    isNewerVersion
  };

  root.MarketTratUpdate = exported;
  if (typeof module !== 'undefined') module.exports = exported;
})(typeof globalThis !== 'undefined' ? globalThis : window);
