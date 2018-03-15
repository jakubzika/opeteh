import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'

export default [
  {
    input: 'src/index.js',
    output: [
      {
        format: 'iife',
        file: 'build/opeteh.umd.js',
        sourcemap: 'inline',
        format: 'umd'
      },
    ],
    moduleName: 'Opeteh',
    plugins: [
      resolve({
        jsnext: true,
        main: true,
        module: true
      }),
      commonjs({
        namedExports: {
          'node_modules/lodash/lodash.js': [
            'unionBy',
            'union',
            'reduce',
            'find',
            'forEach',
            'includes',
            'endsWith',
            'remove',
            'filter',
            'concat',
            'mapValues',
            'pickBy',
          ]
        }
      }),
      babel({
        exclude: 'node_modules/**'
      }),
    ],
    globals: ['io', 'lodash']
},
{
  input: 'src/index.js',
  external: ['ms'],
  output: [
    { file: 'build/opeteh.cjs.js', format: 'cjs' },
    { file: 'build/opeteh.es.js', format: 'es' }
  ]
}
];