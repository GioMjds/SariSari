module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "",
    },
  };
};
