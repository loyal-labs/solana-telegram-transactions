module.exports = {
  extends: ["@commitlint/config-conventional"],
  ignores: [
    (message) =>
      [
        "48a3ce97b145f5d9397f5cb41ceacb18f60931db",
        "5e38a4082978b10096f223af904689763b2226a1",
        "cf7675c951e7afcaac75a0583e2ea46d467ffea7",
      ].some((commitHash) => message.includes(commitHash)),
  ],
};
