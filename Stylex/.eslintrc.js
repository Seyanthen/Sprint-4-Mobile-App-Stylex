module.exports = {
  extends: ['expo'],
  rules: {
    // Hydration state is intentional in the web color-scheme hook.
    'react-hooks/set-state-in-effect': 'off',
  },
};
