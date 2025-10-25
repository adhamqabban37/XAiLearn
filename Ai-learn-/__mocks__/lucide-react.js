module.exports = new Proxy(
  {},
  {
    get: function getter() {
      return () => null;
    },
  }
);
