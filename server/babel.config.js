module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' },
        exclude: ['transform-regenerator', 'proposal-dynamic-import'],
      },
    ],
  ],
};
