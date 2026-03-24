// Smoke test — verify App module loads without throwing.
// Route-level and component tests live in the individual test files.
it('App module imports without throwing', () => {
    expect(() => require('./App')).not.toThrow();
});
