const IS_DEV = process.env.NODE_ENV === 'dev';
const IS_TEST = process.env.NODE_ENV === 'test';
const IS_PROD = process.env.NODE_ENV === 'prod';

console.log('env', process.env.NODE_ENV);

export { IS_DEV, IS_TEST, IS_PROD };
