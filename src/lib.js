import { filter, concat } from 'lodash';


export const resolvePromises = (promises, type, data) => {
  let newPromises = Object.assign({}, promises);
  newPromises[type] = filter(promises[type], (promise) => {
    promise.resolve(data);
    return true;
  });
  return newPromises;
}

export const rejectPromises = (promises, type, data) => {
  return filter(promises[type], (promise) => {
    promise.reject(data);
    return true;
  });
}

export const addPromise = (promises, type, resolve, reject) => {
  let newPromises = Object.assign({}, promises);
  newPromises[type] = concat(promises[type] || [], { resolve, reject });
  return newPromises;
}