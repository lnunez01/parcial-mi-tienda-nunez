module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Permite importar los archivos .sql de drizzle/ como texto (migraciones)
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
