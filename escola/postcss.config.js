export default {
  plugins: {
    autoprefixer: {
      overrideBrowserslist: [
        "> 1%",
        "last 2 versions",
        "not dead",
        "Safari >= 9",
        "iOS >= 9",
        "Chrome >= 60",
        "Firefox >= 60",
        "Edge >= 15",
      ],
    },
  },
};
