declare module 'worker!*' {
  const createWorker: () => Worker;
  export default createWorker;
}