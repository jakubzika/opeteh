import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'

export default [
//   {
//     input: 'src/index.js',
//     output: [
//       {
//         format: 'iife',
//         file: 'build/opeteh.umd.js',
//         format: 'umd'
//       },
//     ],
//     moduleName: 'Opeteh',
//     plugins: [
//       resolve({
//         jsnext: true,
//         main: true,
//         module: true
//       }),
//       commonjs({
//         namedExports: {
//           'node_modules/lodash/lodash.js': [
//             'unionBy',
//             'union',
//             'reduce',
//             'find',
//             'forEach',
//             'includes',
//             'endsWith',
//             'remove',
//             'filter',
//             'concat',
//             'mapValues',
//             'pickBy',
//           ]
//         }
//       }),
//       babel({
//         exclude: 'node_modules/**'
//       }),
//     ],
//     globals: ['io', 'lodash']
// },
{
  input: 'src/index.js',
  external: ['ms'],
  output: [
    // { file: 'build/index.js', format: 'cjs' },
    { file: 'build/index.js', format: 'es' }
  ],
  plugins: [
    babel({
      exclude: 'node_modules/**',
      // presets: ['babel-preset-es2015'],
      plugins: ['transform-async-to-generator'],
      runtimeHelpers: true,
    })
  ]
}
];