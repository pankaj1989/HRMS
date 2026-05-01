const base = require('./base');

module.exports = [
  ...base,
  {
    files: ['**/*.tsx'],
    rules: {
      'react/react-in-jsx-scope': 'off',
    },
  },
];
