import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
export default {
  input: 'src/index.js',
  output: {
    format: 'iife',
    file: 'build/bundle.js',
    sourcemap: 'inline',
  },
  plugins: [
    commonjs(),
    resolve(),
  ],
  globals: ['io']
};